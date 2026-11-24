import type { Shop, ShopSearchResponse } from "../types/shop";

export interface ShopSearchParams {
  lat: number;
  lng: number;
  range: 1 | 2 | 3 | 4 | 5;
  start?: number;
  count?: number;
}

export type ShopApiErrorKind = "network" | "timeout" | "api" | "not-found" | "invalid-request" | "invalid-response";

export class ShopApiError extends Error {
  constructor(
    message: string,
    public readonly status = 0,
    public readonly kind: ShopApiErrorKind = "invalid-response",
  ) {
    super(message);
    this.name = "ShopApiError";
  }

  get retryable() { return this.kind !== "not-found" && this.kind !== "invalid-request"; }
}

// バックエンドの上流タイムアウト（最大30秒）に余裕を持たせる。
export const REQUEST_TIMEOUT_MS = 35_000;

/** 本文の受信まで時間制限を適用し、画面遷移による中断を通信障害として表示しない。 */
async function request(path: string, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;
  let rejectAborted!: (reason: unknown) => void;
  const aborted = new Promise<never>((_resolve, reject) => { rejectAborted = reject; });
  const cancel = () => controller.abort();
  const onAbort = () => rejectAborted(timedOut
    ? new ShopApiError("通信がタイムアウトしました。もう一度お試しください。", 0, "timeout")
    : new DOMException("Request cancelled", "AbortError"));
  controller.signal.addEventListener("abort", onAbort, { once: true });
  signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, REQUEST_TIMEOUT_MS);
  // 中断を無視する通信実装でも画面のローディングを終了させるため、明示的にraceする。
  const receive = async () => {
    if (signal?.aborted) { cancel(); throw new DOMException("Request cancelled", "AbortError"); }
    const response = await fetch(path, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) {
      if (response.status === 404) throw new ShopApiError("お店が見つかりませんでした。", 404, "not-found");
      if (response.status === 400) throw new ShopApiError("検索条件を確認して、もう一度検索してください。", 400, "invalid-request");
      if (response.status === 504 || response.status === 408) throw new ShopApiError("検索がタイムアウトしました。もう一度お試しください。", response.status, "timeout");
      // サーバーの応答本文には内部情報が含まれ得るため、そのまま画面に出さない。
      throw new ShopApiError("お店の情報を取得できませんでした。少し時間をおいて再試行してください。", response.status, "api");
    }
    let body: unknown;
    try { body = await response.json(); }
    catch (error) {
      if (error instanceof SyntaxError) throw new ShopApiError("お店の情報を読み込めませんでした。もう一度お試しください。");
      throw error;
    }
    if (!isRecord(body) || !("data" in body)) throw new ShopApiError("お店の情報を読み込めませんでした。もう一度お試しください。");
    return body.data;
  };
  try { return await Promise.race([aborted, receive()]); }
  catch (error) {
    if (signal?.aborted) throw new DOMException("Request cancelled", "AbortError");
    if (timedOut) throw new ShopApiError("通信がタイムアウトしました。もう一度お試しください。", 0, "timeout");
    if (error instanceof ShopApiError) throw error;
    throw new ShopApiError("通信に失敗しました。接続を確認して再試行してください。", 0, "network");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
    controller.signal.removeEventListener("abort", onAbort);
  }
}

export async function searchShops(params: ShopSearchParams, signal?: AbortSignal): Promise<ShopSearchResponse> {
  const query = new URLSearchParams({ lat: String(params.lat), lng: String(params.lng), range: String(params.range), start: String(params.start ?? 1), count: String(params.count ?? 12) });
  const data = await request(`/api/shops?${query}`, signal);
  if (!isRecord(data) || !Array.isArray(data.shops) || !isRecord(data.pagination)) throw new ShopApiError("お店の情報の形式が正しくありません。");
  const shops = data.shops.map(normalizeShop);
  if (!shops.every(isShop)) throw new ShopApiError("お店の情報の形式が正しくありません。");
  const p = data.pagination;
  if (!nonnegativeInteger(p.total) || !nonnegativeInteger(p.returned) || !positiveInteger(p.start) || !positiveInteger(p.count)
    || p.count > 100 || p.returned !== data.shops.length || p.returned > p.count || p.returned > p.total
    || (p.returned > 0 && p.start + p.returned - 1 > p.total)
    || new Set(shops.map((shop) => shop.id)).size !== shops.length
    || p.start !== (params.start ?? 1) || p.count !== (params.count ?? 12)) throw new ShopApiError("検索結果の件数を読み込めませんでした。");
  return { shops, pagination: { total: p.total, returned: p.returned, start: p.start, count: p.count } };
}

export async function getShop(id: string, signal?: AbortSignal): Promise<Shop> {
  const data = normalizeShop(await request(`/api/shops/${encodeURIComponent(id)}`, signal));
  if (!isShop(data) || data.id !== id) throw new ShopApiError("お店の情報の形式が正しくありません。");
  return data;
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
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

// 説明文の欠損は代替表示に回す。一方、識別子・座標・構造の不正は許容しない。
function normalizeShop(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const text = (input: unknown) => typeof input === "string" ? input.trim() : input ?? undefined;
  const group = (input: unknown, keys: string[]) => isRecord(input)
    ? Object.fromEntries(keys.map((key) => [key, text(input[key])])) : input ?? undefined;
  return {
    ...value,
    name: text(value.name) ?? "", address: text(value.address) ?? "", access: text(value.access) ?? "",
    open: text(value.open), close: text(value.close), capacity: value.capacity ?? undefined,
    urls: group(value.urls, ["pc"]), genre: group(value.genre, ["name", "catch"]),
    budget: group(value.budget, ["name", "average"]),
    photo: isRecord(value.photo) ? { pc: group(value.photo.pc, ["l", "m", "s"]) } : value.photo ?? undefined,
  };
}
