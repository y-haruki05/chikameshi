import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getShop, searchShops, REQUEST_TIMEOUT_MS } from "./shopApi";
import { safeHttpUrl } from "./safeUrl";

const shop = { id: "J000000001", name: "店舗", address: "東京", access: "駅徒歩5分", lat: 35, lng: 139 };
const params = { lat: 35, lng: 139, range: 2 as const, start: 13, count: 12 };
const data = { shops: [shop], pagination: { total: 25, returned: 1, start: 13, count: 12 } };
const fetchMock = vi.fn();
afterEach(() => { vi.useRealTimers(); });
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
it("sends only location and paging parameters to our API and forwards abort", async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ data })));
  const controller = new AbortController();
  expect(await searchShops(params, controller.signal)).toEqual(data);
  const [path, options] = fetchMock.mock.calls[0];
  const query = new URL(path, "http://localhost").searchParams;
  expect(Object.fromEntries(query)).toEqual({ lat: "35", lng: "139", range: "2", start: "13", count: "12" });
  expect(options.signal).toBeInstanceOf(AbortSignal);
  expect(options.cache).toBe("no-store");
});
it.each([
  { ...data, shops: [{ ...shop, photo: { pc: { l: {} } } }] },
  { ...data, shops: [{ ...shop, genre: { name: {} } }] },
  { ...data, shops: [{ ...shop, lat: 91 }] },
  { ...data, pagination: { ...data.pagination, total: -1 } },
  { ...data, pagination: { ...data.pagination, count: 100000 } },
  { ...data, pagination: { ...data.pagination, returned: 2 } },
  { ...data, pagination: { ...data.pagination, start: 1 } },
])("rejects malformed API data without returning partial results", async (invalid) => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: invalid })));
  await expect(searchShops(params)).rejects.toThrow();
});
it("handles invalid JSON", async () => {
  fetchMock.mockResolvedValue(new Response("not json"));
  await expect(searchShops(params)).rejects.toThrow("読み込めませんでした");
});
it("rejects detail responses belonging to another shop", async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: shop })));
  await expect(getShop("J000000002")).rejects.toThrow("形式");
});
it.each(["javascript:alert(1)", "data:text/html,test", "/relative", "file:///tmp/test"])("rejects unsafe external URL %s", (url) => {
  expect(safeHttpUrl(url)).toBeUndefined();
});
it("accepts API image and shop links over HTTP(S)", () => {
  expect(safeHttpUrl("https://example.com/photo.jpg")).toBe("https://example.com/photo.jpg");
  expect(safeHttpUrl("http://example.com/shop")).toBe("http://example.com/shop");
});


it.each([400, 404, 408, 429, 503, 504])("classifies HTTP %s without exposing server details", async (status) => {
  fetchMock.mockResolvedValue(new Response("private upstream key and location", { status }));
  const kind = status === 400 ? "invalid-request" : status === 404 ? "not-found" : [408, 504].includes(status) ? "timeout" : "api";
  await expect(searchShops(params)).rejects.toMatchObject({ kind, status, retryable: ![400, 404].includes(status) });
});
it("classifies a network failure and permits a later successful retry", async () => {
  fetchMock.mockRejectedValueOnce(new TypeError("private URL"));
  await expect(searchShops(params)).rejects.toMatchObject({ kind: "network", status: 0, retryable: true });
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data })));
  expect(await searchShops(params)).toEqual(data);
});
it("cancels an in-flight request without turning it into a timeout", async () => {
  const controller = new AbortController();
  fetchMock.mockImplementation(() => new Promise(() => {}));
  const task = searchShops(params, controller.signal);
  const check = expect(task).rejects.toMatchObject({ name: "AbortError" });
  controller.abort();
  await check;
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
});
it("does not send an already cancelled request", async () => {
  const controller = new AbortController(); controller.abort();
  await expect(searchShops(params, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  expect(fetchMock).not.toHaveBeenCalled();
});
it.each(["headers", "body"])("ends loading when %s stalls even if fetch ignores abort", async (phase) => {
  vi.useFakeTimers();
  fetchMock.mockImplementation(() => phase === "headers" ? new Promise(() => {})
    : Promise.resolve({ ok: true, json: () => new Promise(() => {}) }));
  const task = searchShops(params);
  const check = expect(task).rejects.toMatchObject({ kind: "timeout", retryable: true });
  await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
  await check;
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});
it("cleans up timeout timers after success and malformed JSON", async () => {
  vi.useFakeTimers();
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ data })));
  await searchShops(params);
  expect(vi.getTimerCount()).toBe(0);
  fetchMock.mockResolvedValueOnce(new Response("not json"));
  await expect(searchShops(params)).rejects.toMatchObject({ kind: "invalid-response" });
  expect(vi.getTimerCount()).toBe(0);
});
it("classifies a disconnected body stream as a network failure", async () => {
  fetchMock.mockResolvedValue({ ok: true, json: () => Promise.reject(new TypeError("stream closed")) });
  await expect(searchShops(params)).rejects.toMatchObject({ kind: "network" });
});
it.each([
  { ...data, shops: [shop, shop], pagination: { ...data.pagination, returned: 2 } },
  { ...data, pagination: { ...data.pagination, total: 1 } },
  { ...data, shops: [{ ...shop, genre: [] }] },
])("rejects duplicate IDs, inconsistent intervals and invalid nested shapes", async (invalid) => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: invalid })));
  await expect(searchShops(params)).rejects.toMatchObject({ kind: "invalid-response" });
});
