import { s3 } from "bun";
import { and, eq, inArray, sql } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { generateId } from "better-auth";
import { schema } from "../db";
import { HTTPAppException } from "../lib/errors";
import { s3Options } from "../lib/env";

type PriceListRow = typeof schema.priceList.$inferSelect;
export type PriceListWithUrl = PriceListRow & { fileUrl: string };

const PRESIGN_GET_EXPIRES_IN = 3600; 

export class PricelistService {
  constructor(private db: ReturnType<typeof import("../db").createDb>) {}

  private getFileUrl(s3Key: string): string {
    return s3.file(s3Key, s3Options).presign({
      ...s3Options,
      method: "GET",
      expiresIn: PRESIGN_GET_EXPIRES_IN,
    });
  }

  async createAndActivate(name: string, type: string, fileSize?: number,) {
    if (!name) {
      throw HTTPAppException.BadRequest("File name is required");
    }

    if (type !== "application/pdf") {
      throw HTTPAppException.BadRequest("Only PDF files are allowed");
    }

    const fileId = generateId();
    const s3Key = `priceList/${fileId}.pdf`;

    const uploadUrl = s3.presign(s3Key, {
      ...s3Options,
      method: "PUT",
      type,
      expiresIn: 3600,
    });

    const created = await this.db.transaction(async (tx) => {
      await tx.update(schema.priceList).set({ isActive: false });

      const [inserted] = await tx
          .insert(schema.priceList)
          .values({
            id: fileId,
            s3Key,
            originalName: name,
            fileSize,
            isActive: true,
          })
          .returning();

      return inserted;
    });

    return { ...created, uploadUrl };
  }

  async getHistory(): Promise<PriceListWithUrl[]> {
    const rows = await this.db
        .select()
        .from(schema.priceList)
        .orderBy(desc(schema.priceList.createdAt));

    return rows.map((r) => ({
      ...r,
      fileUrl: this.getFileUrl(r.s3Key),
    }));
  }

  async getCurrent(): Promise<PriceListWithUrl> {
    const current = await this.db.query.priceList.findFirst({
      where: eq(schema.priceList.isActive, true),
    });

    if (!current) {
      throw HTTPAppException.NotFound("Active PriceList");
    }

    return {
      ...current,
      fileUrl: this.getFileUrl(current.s3Key),
    };
  }

  async deleteOne(id: string) {
    if (!id) {
      throw HTTPAppException.BadRequest("ID required");
    }

    const { deleted, s3Key } = await this.db.transaction(async (tx) => {
      const row = await tx.query.priceList.findFirst({
        where: eq(schema.priceList.id, id),
      });

      if (!row) {
        throw HTTPAppException.NotFound("PriceList");
      }

      const [deleted] = await tx
          .delete(schema.priceList)
          .where(eq(schema.priceList.id, id))
          .returning();

      return { deleted, s3Key: row.s3Key };
    });

    try {
      await s3.file(s3Key, s3Options).delete();
    } catch (e) {
      console.error(`S3 delete failed for ${s3Key}:`, e);
      throw HTTPAppException.InternalError(
          "PriceList was removed from the database but storage cleanup failed. You may need to remove the file manually.",
      );
    }

    return deleted;
  }

  async deleteMany(ids: string[]) {
    if (!ids?.length) {
      throw HTTPAppException.BadRequest(
        "At least one photo ID is required",
      );
    }

    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length !== ids.length) {
      throw HTTPAppException.UnprocessableEntity(
        "Duplicate photo IDs are not allowed",
      );
    }

    const { deleted, s3KeysToDelete } = await this.db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: schema.priceList.id, s3Key: schema.priceList.s3Key, isActive: schema.priceList.isActive })
        .from(schema.priceList)
        .where(inArray(schema.priceList.id, uniqueIds));

      if (rows.some(r => r.isActive)) {
        throw HTTPAppException.UnprocessableEntity(
            "Cannot delete the currently active PriceList",
        );
      }

      if (!rows.length) {
        throw HTTPAppException.NotFound("PriceLists");
      }

      const deleted = await tx
        .delete(schema.priceList)
        .where(inArray(schema.priceList.id, uniqueIds))
        .returning();

      return {
        deleted,
        s3KeysToDelete: rows.map((r) => r.s3Key),
      };
    });

    const s3Errors: string[] = [];
    for (const key of s3KeysToDelete) {
      try {
        await s3.file(key, s3Options).delete();
      } catch (e) {
        console.error(`S3 delete failed for ${key}:`, e);
        s3Errors.push(key);
      }
    }

    if (s3Errors.length > 0) {
      throw new HTTPAppException({
        status: 500,
        message:
          "PriceLists were removed from the database but some storage files could not be deleted.",
        meta: { failedKeys: s3Errors },
      });
    }

    return deleted;
  }
}
