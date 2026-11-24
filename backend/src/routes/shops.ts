import { Router } from "express";
import { getShopById, searchShops } from "../services/hotpepperService.js";
import { HOTPEPPER_RANGES, HotPepperRange } from "../types/hotpepper.js";

export const shopsRouter = Router();
shopsRouter.use((_request, response, next) => { response.set("Cache-Control", "no-store"); next(); });

function parseNumber(value: unknown): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

shopsRouter.get("/", async (request, response, next) => {
  const lat = parseNumber(request.query.lat);
  const lng = parseNumber(request.query.lng);
  const range = parseNumber(request.query.range ?? "3");
  const start = parseNumber(request.query.start ?? "1");
  const count = parseNumber(request.query.count ?? "10");

  if (lat === null || lat < -90 || lat > 90) {
    response.status(400).json({ error: { code: "INVALID_LATITUDE", message: "lat must be between -90 and 90." } });
    return;
  }
  if (lng === null || lng < -180 || lng > 180) {
    response.status(400).json({ error: { code: "INVALID_LONGITUDE", message: "lng must be between -180 and 180." } });
    return;
  }
  if (range === null || !HOTPEPPER_RANGES.includes(range as HotPepperRange)) {
    response.status(400).json({ error: { code: "INVALID_RANGE", message: "range must be one of 1, 2, 3, 4, or 5." } });
    return;
  }
  if (start === null || !Number.isSafeInteger(start) || start < 1) {
    response.status(400).json({ error: { code: "INVALID_START", message: "start must be a positive integer." } });
    return;
  }
  if (count === null || !Number.isInteger(count) || count < 1 || count > 100) {
    response.status(400).json({ error: { code: "INVALID_COUNT", message: "count must be an integer between 1 and 100." } });
    return;
  }

  try {
    const data = await searchShops({
      lat,
      lng,
      range: range as HotPepperRange,
      start,
      count,
    });
    response.json({ data });
  } catch (error) {
    next(error);
  }
});

shopsRouter.get("/:id", async (request, response, next) => {
  const id = request.params.id;
  if (!/^J[0-9]{9}$/.test(id)) {
    response.status(400).json({ error: { code: "INVALID_SHOP_ID", message: "Invalid shop ID." } });
    return;
  }
  try {
    const shop = await getShopById(id);
    if (!shop) {
      response.status(404).json({ error: { code: "SHOP_NOT_FOUND", message: "Shop not found." } });
      return;
    }
    response.json({ data: shop });
  } catch (error) { next(error); }
});
