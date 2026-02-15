import {boolean, integer, pgTable, text, timestamp} from "drizzle-orm/pg-core";

export const priceList= pgTable("price_list", {
    id: text("id").primaryKey(),
    s3Key: text("s3_key").notNull(),
    title: text("title"),
    alt: text("alt"),

    originalName: text("original_name"),

    fileSize: integer("file_size"),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .$onUpdate(() => new Date()),
});