import { StrictMode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGeolocation } from "./useGeolocation";

let success: PositionCallback;
let failure: PositionErrorCallback;
const getCurrentPosition = vi.fn((ok: PositionCallback, error?: PositionErrorCallback | null) => { success = ok; failure = error!; });
const position = { coords: { latitude: 35.68, longitude: 139.76 } } as GeolocationPosition;
afterEach(() => { vi.useRealTimers(); });
beforeEach(() => {
  getCurrentPosition.mockClear();
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
});
describe("useGeolocation", () => {
  it("starts only on interaction, prevents duplicate requests and ignores completed callbacks", () => {
    const { result } = renderHook(useGeolocation, { wrapper: StrictMode });
    expect(result.current.status).toBe("idle");
    expect(getCurrentPosition).not.toHaveBeenCalled();
    act(() => { result.current.request(); result.current.request(); });
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("loading");
    act(() => success(position));
    expect(result.current.coordinates).toEqual(position.coords);
    act(() => failure({ code: 3 } as GeolocationPositionError));
    expect(result.current.status).toBe("success");
  });
  it.each([[1, "許可"], [2, "通信環境"], [3, "タイムアウト"], [99, "失敗"]])("explains error %s and allows retry", (code, message) => {
    const { result } = renderHook(useGeolocation);
    act(() => result.current.request());
    const staleSuccess = success;
    act(() => failure({ code } as GeolocationPositionError));
    expect(result.current.error).toContain(message);
    act(() => result.current.request());
    act(() => staleSuccess(position));
    expect(result.current.status).toBe("loading");
    act(() => success(position));
    expect(result.current.status).toBe("success");
  });
  it("ignores cancelled and unmounted callbacks", () => {
    const { result, unmount } = renderHook(useGeolocation);
    act(() => result.current.request());
    act(() => result.current.cancel());
    act(() => success(position));
    expect(result.current.status).toBe("idle");
    act(() => result.current.request());
    unmount();
    act(() => success(position));
  });
  it("explains insecure contexts without requesting", () => {
    vi.stubGlobal("isSecureContext", false);
    const { result } = renderHook(useGeolocation);
    act(() => result.current.request());
    expect(result.current.error).toContain("HTTPSまたはlocalhost");
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });
  it("explains unsupported browsers", () => {
    vi.stubGlobal("navigator", {});
    const { result } = renderHook(useGeolocation);
    act(() => result.current.request());
    expect(result.current.error).toContain("対応していません");
  });
  it("handles synchronous failures", () => {
    getCurrentPosition.mockImplementationOnce(() => { throw new Error("blocked"); });
    const { result } = renderHook(useGeolocation);
    act(() => result.current.request());
    expect(result.current.status).toBe("error");
  });
  it("rejects invalid coordinates", () => {
    const { result } = renderHook(useGeolocation);
    act(() => result.current.request());
    act(() => success({ coords: { latitude: NaN, longitude: 0 } } as GeolocationPosition));
    expect(result.current.status).toBe("error");
  });
});


it("recovers when the browser never invokes either geolocation callback", async () => {
  vi.useFakeTimers();
  const view = renderHook(useGeolocation);
  act(() => view.result.current.request());
  const lateSuccess = success;
  await act(async () => { await vi.advanceTimersByTimeAsync(11_000); });
  expect(view.result.current.status).toBe("error");
  expect(view.result.current.error).toContain("タイムアウト");
  act(() => view.result.current.request());
  act(() => lateSuccess(position));
  expect(view.result.current.status).toBe("loading");
  act(() => success(position));
  expect(view.result.current.status).toBe("success");
  expect(vi.getTimerCount()).toBe(0);
});
