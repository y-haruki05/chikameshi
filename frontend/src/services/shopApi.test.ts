import { beforeEach, expect, it, vi } from "vitest";
import { getShop, searchShops } from "./shopApi";
import { safeHttpUrl } from "./safeUrl";

const shop = { id: "J000000001", name: "店舗", address: "東京", access: "駅徒歩5分", lat: 35, lng: 139 };
const params = { lat: 35, lng: 139, range: 2 as const, start: 13, count: 12 };
const data = { shops: [shop], pagination: { total: 25, returned: 1, start: 13, count: 12 } };
const fetchMock = vi.fn();
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
it("sends only location and paging parameters to our API and forwards abort", async () => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ data })));
  const controller = new AbortController();
  expect(await searchShops(params, controller.signal)).toEqual(data);
  const [path, options] = fetchMock.mock.calls[0];
  const query = new URL(path, "http://localhost").searchParams;
  expect(Object.fromEntries(query)).toEqual({ lat: "35", lng: "139", range: "2", start: "13", count: "12" });
  expect(options.signal).toBe(controller.signal);
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
