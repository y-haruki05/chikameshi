import type {
  HotPepperApiError,
  HotPepperResults,
  HotPepperShop,
  ShopSearchQuery,
  ShopSearchResponse,
} from "../types/hotpepper.js";
import { HotPepperServiceError } from "../types/hotpepper.js";

const API_URL = "https://webservice.recruit.co.jp/hotpepper/gourmet/v1/";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function parseResultsReturned(value: unknown): number {
  if (isFiniteNumber(value) && Number.isSafeInteger(value) && value >= 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed)) return parsed;
  }
  throw new HotPepperServiceError("HotPepper API returned invalid pagination metadata.");
}

function parseShop(value: unknown): HotPepperShop {
  if (!isRecord(value)
    || !isString(value.id) || !/^J[0-9]{9}$/.test(value.id)
    || (value.name != null && !isString(value.name))
    || (value.address != null && !isString(value.address))
    || (value.access != null && !isString(value.access))
    || !isFiniteNumber(value.lat) || Math.abs(value.lat) > 90
    || !isFiniteNumber(value.lng) || Math.abs(value.lng) > 180) {
    throw new HotPepperServiceError("HotPepper API returned an invalid shop record.");
  }

  const strings = (input: unknown, keys: string[]) => {
    if (!isRecord(input)) return undefined;
    return Object.fromEntries(keys.flatMap((key) => typeof input[key] === "string" ? [[key, input[key]]] : []));
  };
  return {
    id: value.id, name: value.name ?? "", address: value.address ?? "", access: value.access ?? "", lat: value.lat, lng: value.lng,
    ...(typeof value.open === "string" ? { open: value.open } : {}),
    ...(typeof value.close === "string" ? { close: value.close } : {}),
    ...(typeof value.capacity === "number" && Number.isSafeInteger(value.capacity) && value.capacity >= 0 ? { capacity: value.capacity } : {}),
    ...(isRecord(value.urls) ? { urls: strings(value.urls, ["pc"]) } : {}),
    ...(isRecord(value.genre) ? { genre: strings(value.genre, ["name", "catch"]) } : {}),
    ...(isRecord(value.budget) ? { budget: strings(value.budget, ["name", "average"]) } : {}),
    ...(isRecord(value.photo) ? { photo: { pc: strings(value.photo.pc, ["l", "m", "s"]) } } : {}),
  };
}

function parseApiError(value: unknown): HotPepperApiError {
  if (!isRecord(value)
    || !(isString(value.code) || isFiniteNumber(value.code))
    || !isString(value.message)) {
    throw new HotPepperServiceError("HotPepper API returned an invalid error record.");
  }
  return { code: value.code, message: value.message };
}

function parseResults(payload: unknown): HotPepperResults {
  if (!isRecord(payload) || !isRecord(payload.results)) {
    throw new HotPepperServiceError("HotPepper API returned an invalid response.");
  }

  const results = payload.results;
  if (!isString(results.api_version)) {
    throw new HotPepperServiceError("HotPepper API returned an invalid API version.");
  }

  if (results.error !== undefined) {
    const error = Array.isArray(results.error)
      ? results.error.map(parseApiError)
      : parseApiError(results.error);
    return {
      api_version: results.api_version,
      results_available: isFiniteNumber(results.results_available) ? results.results_available : 0,
      results_returned: isFiniteNumber(results.results_returned) ? results.results_returned : 0,
      results_start: isFiniteNumber(results.results_start) ? results.results_start : 0,
      error,
    };
  }

  if (!isFiniteNumber(results.results_available) || !Number.isSafeInteger(results.results_available) || results.results_available < 0
    || !isFiniteNumber(results.results_start) || !Number.isSafeInteger(results.results_start) || results.results_start < 1) {
    throw new HotPepperServiceError("HotPepper API returned invalid pagination metadata.");
  }
  const resultsReturned = parseResultsReturned(results.results_returned);

  let shop: HotPepperShop[] | HotPepperShop | undefined;
  if (results.shop !== undefined) {
    shop = Array.isArray(results.shop)
      ? results.shop.map(parseShop)
      : parseShop(results.shop);
  }

  return {
    api_version: results.api_version,
    results_available: results.results_available,
    results_returned: resultsReturned,
    results_start: results.results_start,
    ...(shop === undefined ? {} : { shop }),
  };
}

export function searchShops(query: ShopSearchQuery): Promise<ShopSearchResponse> {
  return requestShops({ lat: String(query.lat), lng: String(query.lng), range: String(query.range), start: String(query.start), count: String(query.count) }, query.count);
}

export async function getShopById(id: string): Promise<HotPepperShop | null> {
  const result = await requestShops({ id, count: "1", start: "1" }, 1);
  return result.shops.find((shop) => shop.id === id) ?? null;
}

/** 秘密のAPIキーはサーバー内に閉じ込め、本文読込までタイムアウトで保護する。 */
async function requestShops(params: Record<string, string>, count: number): Promise<ShopSearchResponse> {
  const apiKey = process.env.HOTPEPPER_API_KEY?.trim();
  if (!apiKey) {
    throw new HotPepperServiceError(
      "HotPepper API key is not configured. Set HOTPEPPER_API_KEY in the project root .env file.",
      503,
      "HOTPEPPER_API_KEY_MISSING",
    );
  }

  const url = new URL(API_URL);
  url.search = new URLSearchParams({
    key: apiKey,
    ...params,
    format: "json",
  }).toString();

  const configuredTimeout = Number(process.env.HOTPEPPER_API_TIMEOUT_MS ?? 5000);
  const timeoutMs = Number.isFinite(configuredTimeout)
    ? Math.min(Math.max(configuredTimeout, 1000), 30000)
    : 5000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (controller.signal.aborted) {
      throw new HotPepperServiceError("HotPepper API request timed out.", 504, "HOTPEPPER_TIMEOUT");
    }

    if (!response.ok) {
      throw new HotPepperServiceError(
        `HotPepper API returned HTTP ${response.status}.`,
        502,
        "HOTPEPPER_HTTP_ERROR",
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
      if (controller.signal.aborted) {
        throw new HotPepperServiceError("HotPepper API request timed out.", 504, "HOTPEPPER_TIMEOUT");
      }
    } catch (error) {
      if (error instanceof HotPepperServiceError) throw error;
      if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
        throw new HotPepperServiceError("HotPepper API request timed out.", 504, "HOTPEPPER_TIMEOUT");
      }
      throw new HotPepperServiceError("HotPepper API returned invalid JSON.");
    }

    const results = parseResults(payload);
    // HTTP 200でもAPIのエラー本文が返るため、成功ステータスだけでは判断しない。
    if (results.error) {
      const apiError = Array.isArray(results.error) ? results.error[0] : results.error;
      const code = Number(apiError?.code);
      const safeCode = Number.isFinite(code) ? code : 502;
      const statusCode = safeCode === 1000 || safeCode === 2000 ? 502 : safeCode === 3000 ? 400 : 502;
      throw new HotPepperServiceError(
        `HotPepper API error (${safeCode}).`,
        statusCode,
        `HOTPEPPER_API_${safeCode}`,
      );
    }

    const shops = results.shop
      ? Array.isArray(results.shop)
        ? results.shop
        : [results.shop]
      : [];

    // 件数やIDの矛盾を境界で拒否し、壊れたページングを画面へ渡さない。
    if (results.results_returned !== shops.length || shops.length > count
      || shops.length > results.results_available
      || (shops.length > 0 && results.results_start + shops.length - 1 > results.results_available)
      || results.results_start !== Number(params.start)
      || new Set(shops.map((shop) => shop.id)).size !== shops.length) {
      throw new HotPepperServiceError("HotPepper API returned inconsistent pagination metadata.");
    }
    return {
      shops,
      pagination: {
        total: results.results_available,
        returned: results.results_returned,
        start: results.results_start,
        count,
      },
    };
  } catch (error) {
    if (error instanceof HotPepperServiceError) throw error;
    if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
      throw new HotPepperServiceError("HotPepper API request timed out.", 504, "HOTPEPPER_TIMEOUT");
    }
    throw new HotPepperServiceError("Could not connect to HotPepper API.", 502, "HOTPEPPER_NETWORK_ERROR");
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}
