import type { Shop, ShopSearchResponse } from "../types/shop";

export interface ShopSearchParams {
  lat: number;
  lng: number;
  range: 1 | 2 | 3 | 4 | 5;
  start?: number;
  count?: number;
}

export class ShopApiError extends Error {
  constructor(message: string, public readonly status = 0) { super(message); }
}

async function request(path: string, signal?: AbortSignal): Promise<unknown> {
  let response: Response;
  try { response = await fetch(path, { signal }); }
  catch (error) {
    if (signal?.aborted) throw error;
    throw new ShopApiError("通信に失敗しました。少し時間をおいて再試行してください。");
  }
  if (!response.ok) {
    throw new ShopApiError(response.status === 404 ? "お店が見つかりませんでした。" : response.status === 504
      ? "検索がタイムアウトしました。もう一度お試しください。" : "お店の情報を取得できませんでした。少し時間をおいて再試行してください。", response.status);
  }
  let body: unknown;
  try { body = await response.json(); } catch { throw new ShopApiError("お店の情報を読み込めませんでした。もう一度お試しください。"); }
  if (!isRecord(body) || !("data" in body)) throw new ShopApiError("お店の情報を読み込めませんでした。もう一度お試しください。");
  return body.data;
}

export async function searchShops(params: ShopSearchParams, signal?: AbortSignal): Promise<ShopSearchResponse> {
  const query = new URLSearchParams({ lat: String(params.lat), lng: String(params.lng), range: String(params.range), start: String(params.start ?? 1), count: String(params.count ?? 12) });
  const data = await request(`/api/shops?${query}`, signal);
  if (!isRecord(data) || !Array.isArray(data.shops) || !data.shops.every(isShop) || !isRecord(data.pagination)) throw new ShopApiError("お店の情報の形式が正しくありません。");
  const p = data.pagination;
  if (!nonnegativeInteger(p.total) || !nonnegativeInteger(p.returned) || !positiveInteger(p.start) || !positiveInteger(p.count)
    || p.count > 100 || p.returned !== data.shops.length || p.returned > p.count || p.returned > p.total
    || p.start !== (params.start ?? 1) || p.count !== (params.count ?? 12)) throw new ShopApiError("検索結果の件数を読み込めませんでした。");
  return { shops: data.shops, pagination: { total: p.total, returned: p.returned, start: p.start, count: p.count } };
}

export async function getShop(id: string, signal?: AbortSignal): Promise<Shop> {
  const data = await request(`/api/shops/${encodeURIComponent(id)}`, signal);
  if (!isShop(data) || data.id !== id) throw new ShopApiError("お店の情報の形式が正しくありません。");
  return data;
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function nonnegativeInteger(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= 0; }
function positiveInteger(value: unknown): value is number { return nonnegativeInteger(value) && value > 0; }
function optionalStrings(value: unknown, keys: string[]): boolean {
  return value === undefined || (isRecord(value) && keys.every((key) => value[key] === undefined || typeof value[key] === "string"));
}
function isShop(value: unknown): value is Shop {
  return isRecord(value) && typeof value.id === "string" && /^J[0-9]{9}$/.test(value.id)
    && [value.name, value.address, value.access].every((v) => typeof v === "string")
    && typeof value.lat === "number" && Number.isFinite(value.lat) && Math.abs(value.lat) <= 90
    && typeof value.lng === "number" && Number.isFinite(value.lng) && Math.abs(value.lng) <= 180
    && [value.open, value.close].every((v) => v === undefined || typeof v === "string")
    && (value.capacity === undefined || nonnegativeInteger(value.capacity))
    && optionalStrings(value.urls, ["pc"]) && optionalStrings(value.genre, ["name", "catch"])
    && optionalStrings(value.budget, ["name", "average"])
    && (value.photo === undefined || (isRecord(value.photo) && optionalStrings(value.photo.pc, ["l", "m", "s"])));
}
