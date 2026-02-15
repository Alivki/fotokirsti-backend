import { route } from "../../../lib/route";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { PhotoService } from "../../../services/PhotoService";

const bodySchema = z.object({
    files: z.array(
        z.object({
            name: z.string().min(1),
            type: z.string().min(1),
        })
    )
});

export const uploadUrlsRoute = route().post(
    "/",
    zValidator('json', bodySchema),
    async (c) => {
        const { db } = c.get("ctx");
        const body = c.req.valid('json');

        const service = new PhotoService(db);
        const urls = await service.getBatchUploadUrls(body.files);

        return c.json(urls, 201);
    }
);