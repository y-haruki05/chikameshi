import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import App from "./App";

const { observeResults } = vi.hoisted(() => ({ observeResults: vi.fn() }));
vi.mock("./pages/ResultsPage", async (importOriginal) => {
  const original = await importOriginal<typeof import("./pages/ResultsPage")>();
  return { ResultsPage: (props: Parameters<typeof original.ResultsPage>[0]) => {
    observeResults(props.coordinates);
    return original.ResultsPage(props);
  } };
});

let success: PositionCallback;
const getCurrentPosition = vi.fn((ok: PositionCallback) => { success = ok; });
beforeEach(() => {
  window.history.replaceState({}, "", "/");
  vi.stubGlobal("isSecureContext", true);
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  getCurrentPosition.mockClear();
});
it("requires two steps, uses the latest range, and preserves coordinates across results operations", async () => {
  const user = userEvent.setup();
  render(<App />);
  const search = screen.getByRole("button", { name: "この条件でお店を探す" }) as HTMLButtonElement;
  expect(search.disabled).toBe(true);
  expect(screen.queryByRole("button", { name: "サンプルを見る" })).toBeNull();
  expect(screen.queryByRole("link", { name: "サンプルを見る" })).toBeNull();
  screen.getByRole("button", { name: "現在地を取得" }).focus();
  await user.keyboard("{Enter}");
  expect((screen.getByRole("button", { name: "現在地を取得中…" }) as HTMLButtonElement).disabled).toBe(true);
  await user.click(screen.getByRole("radio", { name: "500m" }));
  act(() => success({ coords: { latitude: 35.681234, longitude: 139.761234 } } as GeolocationPosition));
  expect(screen.getByText("現在地を取得しました")).toBeTruthy();
  expect(window.location.pathname).toBe("/");
  await user.click(search);
  expect(window.location.search).toBe("?range=2&page=1");
  expect(screen.getByText("現在地取得済み · 検索範囲：500m 以内")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: /検索範囲を変更/ }));
  await user.click(screen.getByRole("radio", { name: "2km" }));
  await user.click(screen.getByRole("button", { name: "この範囲で表示" }));
  expect(screen.getByText("現在地取得済み · 検索範囲：2km 以内")).toBeTruthy();
  const page2 = screen.getByRole("button", { name: "2ページ目" });
  await user.click(page2);
  expect(window.location.search).toBe("?range=4&page=2");
  await user.click(screen.getAllByRole("button", { name: /の詳細を見る/ })[0]);
  await user.click(screen.getByRole("button", { name: "検索結果に戻る" }));
  expect(screen.getByText("現在地取得済み · 検索範囲：2km 以内")).toBeTruthy();
  expect(window.location.search).toBe("?range=4&page=2");
  expect(window.location.href).not.toContain("35.681234");
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
  expect(observeResults).toHaveBeenLastCalledWith({ latitude: 35.681234, longitude: 139.761234 });
});
it("ignores late callbacks after navigating home during acquisition", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "現在地を取得" }));
  await user.click(screen.getByRole("link", { name: "nearby-eats ホーム" }));
  act(() => success({ coords: { latitude: 35, longitude: 139 } } as GeolocationPosition));
  expect((screen.getByRole("button", { name: "この条件でお店を探す" }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.queryByText("現在地を取得しました")).toBeNull();
  expect(getCurrentPosition).toHaveBeenCalledTimes(1);
});
it.each(["/search?range=2&page=1", "/shop/demo-cafe-mori?range=2&page=1"])("renders direct route %s without acquiring location", (path) => {
  window.history.replaceState({}, "", path);
  render(<App />);
  expect(screen.getByRole("main")).toBeTruthy();
  if (path.startsWith("/search")) expect(screen.getByText(/検索範囲：/)).toBeTruthy();
  else expect(screen.getByRole("heading", { level: 1, name: "喫茶とごはん 森の時計" })).toBeTruthy();
  expect(getCurrentPosition).not.toHaveBeenCalled();
});

it("returns to demo results after a reload clears App memory", () => {
  const first = render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "現在地を取得" }));
  act(() => success({ coords: { latitude: 35, longitude: 139 } } as GeolocationPosition));
  fireEvent.click(screen.getByRole("button", { name: "この条件でお店を探す" }));
  first.unmount();
  render(<App />);
  expect(screen.getByText(/検索範囲：/)).toBeTruthy();
  expect(screen.getAllByRole("button", { name: /の詳細を見る/ }).length).toBeGreaterThan(0);
});

// Use real asynchronous history traversal, not a synthetic popstate alone.
async function traverse(direction: "back" | "forward") {
  await act(async () => {
    await new Promise<void>((resolve) => {
      window.addEventListener("popstate", () => resolve(), { once: true });
      window.history[direction]();
    });
  });
}

function acquireAndSearch(latitude: number, longitude: number) {
  fireEvent.click(screen.getByRole("button", { name: "現在地を取得" }));
  act(() => success({ coords: { latitude, longitude } } as GeolocationPosition));
  fireEvent.click(screen.getByRole("button", { name: "この条件でお店を探す" }));
}

it("restores direct demo history and a location session through back and forward", async () => {
  window.history.replaceState({}, "", "/search?range=2&page=1");
  render(<App />);
  expect(observeResults).toHaveBeenLastCalledWith(null);
  fireEvent.click(screen.getByRole("link", { name: "ホームへ戻る" }));
  acquireAndSearch(35, 139);
  const locationSession = window.history.state.searchSessionId;
  expect(Object.keys(window.history.state)).toEqual(["searchSessionId"]);
  await traverse("back");
  await traverse("back");
  expect(window.location.search).toBe("?range=2&page=1");
  expect(observeResults).toHaveBeenLastCalledWith(null);
  await traverse("forward");
  await traverse("forward");
  expect(window.history.state.searchSessionId).toBe(locationSession);
  expect(observeResults).toHaveBeenLastCalledWith({ latitude: 35, longitude: 139 });
});

it("restores distinct coordinates and ranges for multiple searches", async () => {
  render(<App />);
  acquireAndSearch(35, 139);
  fireEvent.click(screen.getByRole("link", { name: "ホームへ戻る" }));
  fireEvent.click(screen.getByRole("radio", { name: "500m" }));
  acquireAndSearch(34, 135);
  expect(observeResults).toHaveBeenLastCalledWith({ latitude: 34, longitude: 135 });
  await traverse("back");
  await traverse("back");
  expect(window.location.search).toBe("?range=3&page=1");
  expect(observeResults).toHaveBeenLastCalledWith({ latitude: 35, longitude: 139 });
  await traverse("forward");
  await traverse("forward");
  expect(window.location.search).toBe("?range=2&page=1");
  expect(observeResults).toHaveBeenLastCalledWith({ latitude: 34, longitude: 135 });
});

it("evicts old location sessions and falls back to demo", async () => {
  render(<App />);
  acquireAndSearch(35, 139);
  for (let i = 0; i < 20; i += 1) {
    fireEvent.click(screen.getByRole("link", { name: "ホームへ戻る" }));
    fireEvent.click(screen.getByRole("button", { name: "この条件でお店を探す" }));
  }
  await act(async () => {
    await new Promise<void>((resolve) => {
      window.addEventListener("popstate", () => resolve(), { once: true });
      window.history.go(-40);
    });
  });
  expect(window.location.pathname).toBe("/search");
  expect(observeResults).toHaveBeenLastCalledWith(null);
});

it.each(["%", "%E0%A4%A", "%FF"])("handles malformed encoded shop ID %s", (id) => {
  window.history.replaceState({}, "", `/shop/${id}?range=2&page=2`);
  render(<App />);
  expect(screen.getByText("お店が見つかりませんでした。")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "検索結果へ戻る" }));
  expect(window.location.search).toBe("?range=2&page=2");
  expect(observeResults).toHaveBeenLastCalledWith(null);
});

it.each(["/", "/search?range=2&page=1", "/search?demo=empty", "/search?demo=error", "/shop/demo-cafe-mori"])("keeps development labels out of the UI at %s", (path) => {
  window.history.replaceState({}, "", path);
  render(<App />);
  expect(document.body.textContent).not.toMatch(/デモ|サンプル|今後追加予定|開発用|検証用/);
  for (const image of screen.queryAllByRole("img")) {
    expect(image.getAttribute("alt")).not.toMatch(/デモ|サンプル/);
  }
  if (path.startsWith("/search")) {
    expect(screen.getByRole("heading", { level: 1, name: "お店一覧" })).toBeTruthy();
  }
});
