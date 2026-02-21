import { s3 } from "bun";
import { and, eq, inArray, sql } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { generateId } from "better-auth";
import { schema } from "../db";
import { HTTPAppException } from "../lib/errors";
import { s3Options } from "../lib/env";

type PhotoInsert = (typeof schema.photo.$inferInsert);
type PhotoRow = (typeof schema.photo.$inferSelect);

type PhotoSelected = Pick<PhotoRow, keyof typeof photoSelectFields>;
export type PhotoWithUrl = PhotoSelected & { imageUrl: string };

const PRESIGN_GET_EXPIRES_IN = 3600;

const cloudFrontDomain = process.env.CLOUD_FRONT_URL;

const photoSelectFields = {
  id: true,
  title: true,
  alt: true,
  published: true,
  category: true,
  hasPrize: true,
  prizeTitle: true,
  prizeMedal: true,
  width: true,
  height: true,
  aspectRatio: true,
  createdAt: true,
  updatedAt: true,
};

export class PhotoService {
  constructor(private db: ReturnType<typeof import("../db").createDb>) {
  }

  private getImageUrl(s3Key: string): string {
    return s3.file(s3Key, s3Options).presign({
      ...s3Options,
      method: "GET",
      expiresIn: PRESIGN_GET_EXPIRES_IN,
    });
  }

  async getBatchUploadUrls(files: { name: string; type: string }[]) {
    if (!files?.length) {
      throw HTTPAppException.BadRequest(
          "At least one file is required to generate upload URLs",
      );
    }

    const items = files.map((file) => {
      const fileId = generateId();
      const extension = file.name.split(".").pop() ?? "";
      const s3Key = `photos/${fileId}/original`;

      const uploadUrl = s3.presign(s3Key, {
        ...s3Options,
        method: "PUT",
        type: file.type,
        expiresIn: 3600,
      });

      return {uploadUrl, s3Key, fileId};
    });

    await this.db.transaction(async (tx) => {
      const now = new Date();
      await tx.insert(schema.photo).values(
          items.map(({fileId, s3Key}) => ({
            id: fileId,
            s3Key,
            published: false,
            status: "processing" as const,
            updatedAt: now,
          })),
      );
    });

    return items;
  }

  async createPhotos(data: PhotoInsert[]) {
    if (!data?.length) {
      throw HTTPAppException.UnprocessableEntity(
          "At least one photo record is required",
      );
    }

    const records = data.map((photo) => ({
      ...photo,
      id: photo.id ?? generateId(),
    }));

    return this.db.transaction(async (tx) => {
      return tx
          .insert(schema.photo)
          .values(records)
          .onConflictDoUpdate({
            target: schema.photo.id,
            set: {
              title: sql.raw("excluded.title"),
              alt: sql.raw("excluded.alt"),
              published: sql.raw("excluded.published"),
              category: sql.raw("excluded.category"),
              hasPrize: sql.raw("excluded.has_prize"),
              prizeTitle: sql.raw("excluded.prize_title"),
              prizeMedal: sql.raw("excluded.prize_medal"),
              updatedAt: sql.raw("excluded.updated_at"),
            },
          })
          .returning();
    });
  }

  async updatePhoto(id: string, data: Partial<PhotoInsert>) {
    if (!id?.trim()) {
      throw HTTPAppException.BadRequest("Photo ID is required");
    }
    if (!data || Object.keys(data).length === 0) {
      throw HTTPAppException.BadRequest(
          "Update data is required (e.g. title, published, category)",
      );
    }

    return this.db.transaction(async (tx) => {
      const [updated] = await tx
          .update(schema.photo)
          .set(data)
          .where(eq(schema.photo.id, id))
          .returning();

      if (!updated) {
        throw HTTPAppException.NotFound("Photo");
      }
      return updated;
    });
  }

  async findMany(category?: string, hasPrize?: boolean, pageSize: number = 50, page: number = 0): Promise<{ photos: PhotoWithUrl[]; total: number }> {
    const categoryValue = category?.trim();
    const offset = page * pageSize;

    const photos = await this.db.query.photo.findMany({
      columns: { ...photoSelectFields },
      where: and(
          eq(schema.photo.published, true),
          eq(schema.photo.status, "ready"),
          categoryValue
              ? eq(schema.photo.category, categoryValue as NonNullable<typeof schema.photo.$inferSelect["category"]>)
              : undefined,
          hasPrize !== undefined
              ? eq(schema.photo.hasPrize, hasPrize)
              : undefined,
      ),
      limit: pageSize,
      offset,
      orderBy: [desc(schema.photo.createdAt)],
    });

    const countResult = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.photo)
        .where(and(
            eq(schema.photo.published, true),
            eq(schema.photo.status, "ready"),
            categoryValue
                ? eq(schema.photo.category, categoryValue as NonNullable<typeof schema.photo.$inferSelect["category"]>)
                : undefined,
            hasPrize !== undefined
                ? eq(schema.photo.hasPrize, hasPrize)
                : undefined,
        ));

    const total = Number(countResult[0]?.count ?? 0);

    const photosWithUrl: PhotoWithUrl[] = photos.map((p) => {
      const row = p as PhotoSelected;
      return { ...row, imageUrl: `https://${cloudFrontDomain}/photos/${row.id}/preview.webp` };
    });

    return { photos: photosWithUrl, total };
  }

  async findManyAdmin(category?: string, published?: boolean, hasPrize?: boolean): Promise<{ photos: PhotoWithUrl[] }> {
    const categoryValue = category?.trim();
    const photos = await this.db.query.photo.findMany({
      columns: { ...photoSelectFields },
      where: and(
          categoryValue
              ? eq(schema.photo.category, categoryValue as NonNullable<typeof schema.photo.$inferSelect["category"]>)
              : undefined,
          published !== undefined
              ? eq(schema.photo.published, published)
              : undefined,
          hasPrize !== undefined
              ? eq(schema.photo.hasPrize, hasPrize)
              : undefined,
      ),
      orderBy: [desc(schema.photo.createdAt)],
    });

    const photosWithUrl: PhotoWithUrl[] = photos.map((p) => {
      const row = p as PhotoSelected;
      return { ...row, imageUrl: `https://${cloudFrontDomain}/photos/${row.id}/preview.webp` };
    });

    return { photos: photosWithUrl };
  }

  async findOne(id: string): Promise<PhotoWithUrl> {
    if (!id?.trim()) {
      throw HTTPAppException.BadRequest("Photo ID is required");
    }

    const result = await this.db.query.photo.findFirst({
      columns: photoSelectFields,
      where: and(
          eq(schema.photo.id, id),
          eq(schema.photo.published, true),
          eq(schema.photo.status, "ready"),
      ),
    });

    if (!result) {
      throw HTTPAppException.NotFound("Photo");
    }

    const row = result as PhotoSelected;
    return { ...row, imageUrl: `https://${cloudFrontDomain}/photos/${row.id}/preview.webp` };
  }

  async deleteOne(id: string): Promise<PhotoRow | undefined> {
    const getS3KeysForPhoto = (id: string) => [
      `photos/${id}/original`,
      `photos/${id}/preview.webp`,
      `photos/${id}/medium.webp`,
      `photos/${id}/large.webp`,
    ];

    if (!id?.trim()) {
      throw HTTPAppException.BadRequest("Photo ID is required");
    }

    const s3Keys = await this.db.transaction(async (tx) => {
      const [row] = await tx
          .select({s3Key: schema.photo.s3Key})
          .from(schema.photo)
          .where(eq(schema.photo.id, id))
          .limit(1);

      if (!row) {
        throw HTTPAppException.NotFound("Photo");
      }

      const [deleted] = await tx
          .delete(schema.photo)
          .where(eq(schema.photo.id, id))
          .returning();

      return {s3Key: row.s3Key, deleted};
    });

    const keys = getS3KeysForPhoto(id);

    try {
      await Promise.all(keys.map(key => s3.file(key, s3Options).delete()));
    } catch (e) {
      console.error(`S3 cleanup failed for ${id}:`, e);
      throw HTTPAppException.InternalError(
          "Photo was removed from the database but storage cleanup failed. You may need to remove the file manually.",
      );
    }

    return s3Keys.deleted;
  }

  async batchPublish(ids: string[], published: boolean) {
    if (!ids?.length) {
      throw HTTPAppException.BadRequest(
          "At least one photo ID is required",
      );
    }

    if (published === undefined) {
      throw HTTPAppException.BadRequest(
          "You need to choose if images should be published or unpublished"
      );
    }

    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length !== ids.length) {
      throw HTTPAppException.UnprocessableEntity(
          "Duplicate photo IDs are not allowed",
      );
    }

    const result = await this.db.transaction(async (tx) => {
      const existingPhotos = await tx
          .select({id: schema.photo.id})
          .from(schema.photo)
          .where(inArray(schema.photo.id, uniqueIds));

      if (existingPhotos.length !== uniqueIds.length) {
        throw HTTPAppException.NotFound(
            "One or more photos do not exist",
        );
      }

      const updated = await tx
          .update(schema.photo)
          .set({
            published,
            updatedAt: new Date(),
          })
          .where(inArray(schema.photo.id, uniqueIds))
          .returning();

      return updated;
    });

    return {
      success: true,
      count: result.length,
      photos: result,
    };
  }

  async deleteMany(ids: string[]) {
    const getS3KeysForPhoto = (id: string) => [
      `photos/${id}/original`,
      `photos/${id}/preview.webp`,
      `photos/${id}/medium.webp`,
      `photos/${id}/large.webp`,
    ];

    if (!ids?.length) {
      throw HTTPAppException.BadRequest("At least one photo ID is required");
    }

    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length !== ids.length) {
      throw HTTPAppException.UnprocessableEntity("Duplicate photo IDs are not allowed");
    }

    // 1. Delete from Database
    const deletedRows = await this.db.transaction(async (tx) => {
      // We check existence first to stay consistent with your original logic
      const rows = await tx
          .select({id: schema.photo.id})
          .from(schema.photo)
          .where(inArray(schema.photo.id, uniqueIds));

      if (!rows.length) {
        throw HTTPAppException.NotFound("Photos");
      }

      return await tx
          .delete(schema.photo)
          .where(inArray(schema.photo.id, uniqueIds))
          .returning();
    });

    const allKeysToDelete = deletedRows.flatMap((row) => getS3KeysForPhoto(row.id));

    const results = await Promise.allSettled(
        allKeysToDelete.map((key) => s3.file(key, s3Options).delete())
    );

    const s3Errors = results
        .map((res, index) => (res.status === "rejected" ? allKeysToDelete[index] : null))
        .filter((key): key is string => key !== null);

    if (s3Errors.length > 0) {
      throw new HTTPAppException({
        status: 500,
        message: "Photos were removed from the database but some storage files could not be deleted.",
        meta: {failedKeys: s3Errors},
      });
    }

    return deletedRows;
  }
}
