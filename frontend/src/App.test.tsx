import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import App from "./App";
import type { Shop } from "./types/shop";

const shops: Shop[] = Array.from({ length: 25 }, (_, i) => ({
  id: `J${String(i + 1).padStart(9, "0")}`, name: `実店舗${i + 1}`, address: "東京都千代田区", access: "駅から徒歩5分",
  lat: 35.68, lng: 139.76, photo: { pc: { l: "https://example.com/photo.jpg" } },
  genre: { name: "和食", catch: "旬の料理" }, budget: { name: "3000円", average: "3500円" },
  open: "11:00〜22:00", close: "月曜", capacity: 30, urls: { pc: "https://www.hotpepper.jp/strJ000000001/" },
}));
function json(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status }); }
function responseFor(path: string) {
  const url = new URL(path, "http://localhost");
  if (url.pathname !== "/api/shops") return json({ data: shops.find((s) => url.pathname.endsWith(s.id)) }, 200);
  const start = Number(url.searchParams.get("start"));
  const count = Number(url.searchParams.get("count"));
  const selected = shops.slice(start - 1, start - 1 + count);
  return json({ data: { shops: selected, pagination: { total: shops.length, returned: selected.length, start, count } } });
}
let success: PositionCallback;
const getCurrentPosition = vi.fn((ok: PositionCallback) => { success = ok; });
const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => responseFor(String(input)));
beforeEach(() => {
  window.history.replaceState({}, "", "/");
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("fetch", fetchMock);
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 0; });
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  getCurrentPosition.mockClear();
  fetchMock.mockClear();
  fetchMock.mockImplementation(async (input) => responseFor(String(input)));
});
function acquireAndSearch(latitude = 35.681234, longitude = 139.761234) {
  fireEvent.click(screen.getByRole("button", { name: "現在地を取得" }));
  act(() => success({ coords: { latitude, longitude } } as GeolocationPosition));
  fireEvent.click(screen.getByRole("button", { name: "この条件でお店を探す" }));
}
async function traverse(direction: "back" | "forward", distance?: number) {
  await act(async () => {
    await new Promise<void>((resolve) => {
      window.addEventListener("popstate", () => resolve(), { once: true });
      if (distance !== undefined) window.history.go(distance); else window.history[direction]();
    });
  });
}
function lastSearch() {
  const call = fetchMock.mock.calls.filter(([path]) => String(path).startsWith("/api/shops?" )).slice(-1)[0]!;
  return new URL(String(call[0]), "http://localhost").searchParams;
}
it("requires two steps and sends coordinates, range and API pagination; displays actual details", async () => {
  const user = userEvent.setup();
  render(<App />);
  const search = screen.getByRole("button", { name: "この条件でお店を探す" }) as HTMLButtonElement;
  expect(search.disabled).toBe(true);
  expect(fetchMock).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "現在地を取得" }));
  await user.click(screen.getByRole("radio", { name: "500m" }));
  act(() => success({ coords: { latitude: 35.68, longitude: 139.76 } } as GeolocationPosition));
  expect(window.location.pathname).toBe("/");
  expect(fetchMock).not.toHaveBeenCalled();
  await user.click(search);
  await screen.findByText("実店舗1");
  expect(lastSearch().get("lat")).toBe("35.68");
  expect(lastSearch().get("lng")).toBe("139.76");
  expect(lastSearch().get("range")).toBe("2");
  expect(screen.getByText("全25件中1〜12件を表示")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "2ページ目" }));
  await screen.findByText("実店舗13");
  expect(lastSearch().get("start")).toBe("13");
  expect(lastSearch().get("count")).toBe("12");
  await user.click(screen.getByRole("button", { name: "実店舗13の詳細を見る" }));
  await screen.findByRole("heading", { level: 1, name: "実店舗13" });
  expect(screen.getByText("11:00〜22:00")).toBeTruthy();
  expect(screen.getByText("30席")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "検索結果に戻る" }));
  await screen.findByText("実店舗13");
  expect(window.location.search).toBe("?range=2&page=2");
  await user.click(screen.getByRole("button", { name: /検索範囲を変更/ }));
  await user.click(screen.getByRole("radio", { name: "2km" }));
  await user.click(screen.getByRole("button", { name: "この範囲で表示" }));
  await screen.findByText("実店舗1");
  expect(lastSearch().get("range")).toBe("4");
  expect(lastSearch().get("start")).toBe("1");
  expect(Object.keys(window.history.state).sort()).toEqual(["entryKey", "searchSessionId"]);
  expect(window.location.href).not.toContain("35.68");
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
});
it("ignores late geolocation callbacks after navigation", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "現在地を取得" }));
  fireEvent.click(screen.getByRole("link", { name: "nearby-eats ホーム" }));
  act(() => success({ coords: { latitude: 35, longitude: 139 } } as GeolocationPosition));
  expect((screen.getByRole("button", { name: "この条件でお店を探す" }) as HTMLButtonElement).disabled).toBe(true);
  expect(fetchMock).not.toHaveBeenCalled();
});
it("restores distinct coordinates and ranges through real back and forward", async () => {
  render(<App />);
  acquireAndSearch(35, 139);
  await screen.findByText("実店舗1");
  fireEvent.click(screen.getByRole("link", { name: "ホームへ戻る" }));
  fireEvent.click(screen.getByRole("radio", { name: "500m" }));
  acquireAndSearch(34, 135);
  await screen.findByText("実店舗1");
  expect(lastSearch().get("lat")).toBe("34");
  await traverse("back"); await traverse("back");
  await screen.findByText("実店舗1");
  expect(lastSearch().get("lat")).toBe("35");
  expect(lastSearch().get("range")).toBe("3");
  await traverse("forward"); await traverse("forward");
  await screen.findByText("実店舗1");
  expect(lastSearch().get("lat")).toBe("34");
  expect(lastSearch().get("range")).toBe("2");
});
it("requires a fresh location on reload without sending a request", async () => {
  const first = render(<App />); acquireAndSearch();
  await screen.findByText("実店舗1");
  first.unmount(); fetchMock.mockClear();
  render(<App />);
  expect(screen.getByText("現在地を取得してお店を探してください。")).toBeTruthy();
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.queryByText("実店舗1")).toBeNull();
});
it("direct search does not acquire location or show samples", () => {
  window.history.replaceState({}, "", "/search?range=2&page=1&demo=success");
  render(<App />);
  expect(screen.getByRole("button", { name: "現在地を取得する" })).toBeTruthy();
  expect(fetchMock).not.toHaveBeenCalled(); expect(getCurrentPosition).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: /の詳細を見る/ })).toBeNull();
});
it("loads detail by ID on a direct link and after reload", async () => {
  window.history.replaceState({}, "", "/shop/J000000001");
  const first = render(<App />);
  await screen.findByRole("heading", { name: "実店舗1" });
  expect(fetchMock.mock.calls[0][0]).toBe("/api/shops/J000000001");
  first.unmount(); render(<App />);
  await screen.findByRole("heading", { name: "実店舗1" });
  expect(getCurrentPosition).not.toHaveBeenCalled();
});
it.each(["%", "%E0%A4%A", "%FF", "demo-cafe-mori"])("rejects invalid detail ID %s without fetching", (id) => {
  window.history.replaceState({}, "", `/shop/${id}`); render(<App />);
  expect(screen.getByText("お店が見つかりませんでした。")).toBeTruthy();
  expect(fetchMock).not.toHaveBeenCalled();
});
it("shows empty results from the API", async () => {
  fetchMock.mockImplementation(async () => json({ data: { shops: [], pagination: { total: 0, returned: 0, start: 1, count: 12 } } }));
  render(<App />); acquireAndSearch();
  await screen.findByRole("heading", { name: "お店が見つかりませんでした" });
  expect(screen.queryByRole("button", { name: /の詳細を見る/ })).toBeNull();
});
it.each([503, 504])("shows API error %s without samples and retries the same search", async (status) => {
  fetchMock.mockResolvedValueOnce(json({ error: { message: "server private details" } }, status));
  render(<App />); acquireAndSearch();
  await screen.findByRole("alert");
  expect(screen.queryByRole("button", { name: /の詳細を見る/ })).toBeNull();
  expect(document.body.textContent).not.toContain("server private details");
  fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
  await screen.findByText("実店舗1");
  expect(lastSearch().get("lat")).toBe("35.681234");
});
it("aborts stale searches and ignores late results after a range change", async () => {
  let resolveOld!: (response: Response) => void;
  fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveOld = resolve; }));
  render(<App />); acquireAndSearch();
  expect(screen.getByRole("status", { name: "お店を読み込み中" })).toBeTruthy();
  const signal = fetchMock.mock.calls[0][1]?.signal;
  fireEvent.click(screen.getByRole("button", { name: /検索範囲を変更/ }));
  fireEvent.click(screen.getByRole("radio", { name: "500m" }));
  fireEvent.click(screen.getByRole("button", { name: "この範囲で表示" }));
  await screen.findByText("実店舗1");
  expect(signal?.aborted).toBe(true);
  await act(async () => resolveOld(json({ data: { shops: [], pagination: { total: 0, returned: 0, start: 1, count: 12 } } })));
  expect(screen.getByText("実店舗1")).toBeTruthy();
});
it("handles detail not found and retryable errors separately", async () => {
  window.history.replaceState({}, "", "/shop/J000000001");
  fetchMock.mockResolvedValueOnce(json({}, 503)); render(<App />);
  await screen.findByRole("alert");
  fetchMock.mockResolvedValueOnce(json({}, 404));
  fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
  await screen.findByText("お店が見つかりませんでした。");
});
it("never displays old shops when the next page fails", async () => {
  render(<App />); acquireAndSearch(); await screen.findByText("実店舗1");
  fetchMock.mockRejectedValueOnce(new TypeError("offline"));
  fireEvent.click(screen.getByRole("button", { name: "2ページ目" }));
  await screen.findByRole("alert");
  expect(screen.queryByText("実店舗1")).toBeNull();
});
it("bounds retained sessions and asks for location for evicted history", async () => {
  render(<App />); acquireAndSearch(); await screen.findByText("実店舗1");
  for (let i = 0; i < 20; i += 1) {
    fireEvent.click(screen.getByRole("link", { name: "ホームへ戻る" }));
    fireEvent.click(screen.getByRole("button", { name: "この条件でお店を探す" }));
    await screen.findByText("実店舗1");
  }
  await traverse("back", -40);
  expect(screen.getByText("現在地を取得してお店を探してください。")).toBeTruthy();
});
it("keeps development labels and fabricated review scores out of the UI", async () => {
  render(<App />); acquireAndSearch(); await screen.findByText("実店舗1");
  expect(document.body.textContent).not.toMatch(/デモ|サンプル|今後追加予定|開発用|検証用/);
  expect(document.querySelector("svg.lucide-star")).toBeNull();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
});

it("retries empty results and re-submits an unchanged range", async () => {
  fetchMock.mockResolvedValueOnce(json({ data: { shops: [], pagination: { total: 0, returned: 0, start: 1, count: 12 } } }));
  render(<App />); acquireAndSearch();
  await screen.findByRole("heading", { name: "お店が見つかりませんでした" });
  fireEvent.click(screen.getByRole("button", { name: "もう一度検索" }));
  await screen.findByText("実店舗1");
  expect(fetchMock).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: /検索範囲を変更/ }));
  fireEvent.click(screen.getByRole("button", { name: "この範囲で表示" }));
  await screen.findByText("実店舗1");
  expect(fetchMock).toHaveBeenCalledTimes(3);
});


it("shows the actual interval on middle and final pages", async () => {
  render(<App />); acquireAndSearch();
  await screen.findByText("全25件中1〜12件を表示");
  fireEvent.click(screen.getByRole("button", { name: "2ページ目" }));
  await screen.findByText("全25件中13〜24件を表示");
  fireEvent.click(screen.getByRole("button", { name: "3ページ目" }));
  await screen.findByText("全25件中25〜25件を表示");
  expect((screen.getByRole("button", { name: "次のページ" }) as HTMLButtonElement).disabled).toBe(true);
});
it("distinguishes an out-of-range page from an empty search and recovers", async () => {
  render(<App />); acquireAndSearch(); await screen.findByText("実店舗1");
  act(() => {
    window.history.pushState(window.history.state, "", "/search?range=3&page=99");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await screen.findByRole("heading", { name: "ページが見つかりませんでした" });
  expect(screen.queryByText("お店が見つかりませんでした")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "最初のページへ" }));
  await screen.findByText("全25件中1〜12件を表示");
  expect(window.location.search).toBe("?range=3&page=1");
});
it("opens and focuses range controls from an empty result", async () => {
  fetchMock.mockResolvedValueOnce(json({ data: { shops: [], pagination: { total: 0, returned: 0, start: 1, count: 12 } } }));
  render(<App />); acquireAndSearch();
  await screen.findByRole("heading", { name: "お店が見つかりませんでした" });
  expect(screen.getByText("0件")).toBeTruthy();
  const buttons = screen.getAllByRole("button", { name: /検索範囲を変更/ });
  fireEvent.click(buttons[buttons.length - 1]);
  expect(screen.getByRole("radio", { name: "1km" })).toBe(document.activeElement);
  fireEvent.click(screen.getByRole("radio", { name: "3km" }));
  fireEvent.click(screen.getByRole("button", { name: "この範囲で表示" }));
  await screen.findByText("実店舗1");
  expect(lastSearch().get("range")).toBe("5");
});
it("restores list scroll only after its delayed response and keeps forward history", async () => {
  render(<App />); acquireAndSearch(); await screen.findByText("実店舗1");
  vi.spyOn(window, "scrollY", "get").mockReturnValue(840);
  fireEvent.click(screen.getByRole("button", { name: "実店舗1の詳細を見る" }));
  await screen.findByRole("heading", { name: "実店舗1" });
  vi.spyOn(window, "scrollY", "get").mockReturnValue(120);
  let resolveList!: (response: Response) => void;
  fetchMock.mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveList = resolve; }));
  vi.mocked(window.scrollTo).mockClear();
  fireEvent.click(screen.getByRole("button", { name: "検索結果に戻る" }));
  await screen.findByRole("status", { name: "お店を読み込み中" });
  expect(window.scrollTo).not.toHaveBeenCalledWith({ top: 840, behavior: "instant" });
  await act(async () => resolveList(responseFor("/api/shops?start=1&count=12")));
  await screen.findByText("実店舗1");
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 840, behavior: "instant" });
  await traverse("forward");
  await screen.findByRole("heading", { name: "実店舗1" });
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 120, behavior: "instant" });
  await traverse("back");
  await screen.findByText("全25件中1〜12件を表示");
});
it("renders missing and blank shop information with useful fallbacks", async () => {
  window.history.replaceState({}, "", "/shop/J000000001");
  fetchMock.mockResolvedValueOnce(json({ data: { id: "J000000001", lat: 35, lng: 139, name: "  ", address: null,
    open: " ", close: null, photo: null, budget: { average: " ", name: null }, capacity: null } }));
  render(<App />);
  await screen.findByRole("heading", { name: "店舗名不明" });
  expect(screen.getByText("住所情報なし")).toBeTruthy();
  expect(screen.getByText("予算情報なし")).toBeTruthy();
  expect(screen.getAllByText("店舗にお問い合わせください").length).toBeGreaterThan(0);
  expect(screen.getByRole("img", { name: "店舗名不明の写真は現在表示できません" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: /ホットペッパーグルメを見る/ })).toBeNull();
});


it("rejects an overflowing pagination offset without requesting it", async () => {
  render(<App />); acquireAndSearch(); await screen.findByText("実店舗1");
  fetchMock.mockClear();
  act(() => {
    window.history.pushState(window.history.state, "", "/search?range=3&page=9007199254740991");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  expect(screen.getByRole("heading", { name: "ページが見つかりませんでした" })).toBeTruthy();
  expect(fetchMock).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "最初のページへ" }));
  await screen.findByText("実店舗1");
});
it("keeps cards usable when descriptive text and images are missing", async () => {
  fetchMock.mockResolvedValueOnce(json({ data: { shops: [{ id: "J000000001", lat: 35, lng: 139, name: null, genre: null, budget: null }],
    pagination: { total: 1, returned: 1, start: 1, count: 12 } } }));
  render(<App />); acquireAndSearch();
  await screen.findByText("全1件中1〜1件を表示");
  expect(screen.getByRole("button", { name: "店舗名不明の詳細を見る" })).toBeTruthy();
  expect(screen.getByText("アクセス情報なし")).toBeTruthy();
  expect(screen.getByText("予算情報なし")).toBeTruthy();
});
