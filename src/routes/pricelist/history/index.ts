import { route } from "../../../lib/route";
import {PricelistService} from "../../../services/PricelistService";

export const historyRoute = route().get(
    "/",
    async (c) => {
    const { db } = c.get("ctx");

    const service = new PricelistService(db);
    const priceLists = await service.getHistory();

    return c.json(priceLists);
});

