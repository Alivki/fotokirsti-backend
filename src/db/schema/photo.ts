import {pgTable, text, timestamp, boolean, pgEnum, integer, doublePrecision} from "drizzle-orm/pg-core";

export const categoryEnum = pgEnum("photo_category", [
    "Barn",
    "Familie",
    "Portrett",
    "Konfirmant",
    "Bryllup",
    "Produkt",
    "Reklame"
]);

export const medalEnum = pgEnum("medal_type", [
    "Gull",
    "Sølv",
    "Bronse",
    "Hederlig omtale"
]);

export const statusEnum = pgEnum("photo_status", ["processing", "ready", "failed"]);

export const photo = pgTable("photo", {
    id: text("id").primaryKey(),
    s3Key: text("s3_key").notNull(),
    title: text("title"),
    alt: text("alt"),
    published: boolean("published"),

    category: categoryEnum("category"),

    hasPrize: boolean("has_prize").default(false),
    prizeTitle: text("prize_title"),
    prizeMedal: medalEnum("prize_medal"),

    status: statusEnum("status").default("processing"),
    width: integer("width"),
    height: integer("height"),
    aspectRatio: doublePrecision("aspect_ratio"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .notNull()
        .$onUpdate(() => new Date()),
});