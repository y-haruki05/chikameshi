import type { ApiError, ShopSearchResponse } from "../types/shop";

export interface ShopSearchParams {
  lat: number;
  lng: number;
  range: 1 | 2 | 3 | 4 | 5;
  start?: number;
  count?: number;
}

export async function searchShops(params: ShopSearchParams): Promise<ShopSearchResponse> {
  const query = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    range: String(params.range),
    start: String(params.start ?? 1),
    count: String(params.count ?? 10),
  });
  const response = await fetch(`/api/shops?${query}`);
  const body: unknown = await response.json();

  if (!response.ok) {
    const message = isApiError(body) ? body.error.message : "店舗検索に失敗しました。";
    throw new Error(message);
  }
  if (!isSearchResponse(body)) throw new Error("APIレスポンスの形式が正しくありません。");
  return body.data;
}

function isApiError(value: unknown): value is ApiError {
  if (typeof value !== "object" || value === null || !("error" in value)) return false;
  const error = value.error;
  return typeof error === "object"
    && error !== null
    && "code" in error
    && typeof error.code === "string"
    && "message" in error
    && typeof error.message === "string";
}

function isSearchResponse(value: unknown): value is { data: ShopSearchResponse } {
  if (typeof value !== "object" || value === null || !("data" in value)) return false;
  const data = value.data;
  if (typeof data !== "object" || data === null || !("shops" in data) || !Array.isArray(data.shops)
    || !("pagination" in data) || typeof data.pagination !== "object" || data.pagination === null) return false;

  const pagination = data.pagination;
  return "total" in pagination && Number.isInteger(pagination.total)
    && "returned" in pagination && Number.isInteger(pagination.returned)
    && "start" in pagination && Number.isInteger(pagination.start)
    && "count" in pagination && Number.isInteger(pagination.count);
}
