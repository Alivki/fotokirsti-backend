import { route } from "../../lib/route";
import {PricelistService} from "../../services/PricelistService";


export const getRoute = route().get(
    "/",
    async (c) => {
    const { db } = c.get("ctx");

    const service = new PricelistService(db);
    const priceList = await service.getCurrent();

    return c.json(priceList);
});

