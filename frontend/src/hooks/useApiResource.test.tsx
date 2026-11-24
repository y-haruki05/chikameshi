import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useApiResource } from "./useApiResource";

it("ignores retry bursts both during loading and before the retry render", async () => {
  let finish!: (value: string) => void;
  const load = vi.fn(() => new Promise<string>((resolve) => { finish = resolve; }));
  const view = renderHook(() => useApiResource("shops", load));
  act(() => { view.result.current.retry(); view.result.current.retry(); });
  expect(load).toHaveBeenCalledTimes(1);
  await act(async () => finish("first"));
  act(() => { view.result.current.retry(); view.result.current.retry(); });
  expect(load).toHaveBeenCalledTimes(2);
  await act(async () => finish("second"));
  expect(view.result.current.resource).toEqual({ status: "success", data: "second" });
});
it("turns a synchronous loader failure into a recoverable error", async () => {
  const load = vi.fn((): Promise<string> => { throw new Error("failed"); });
  const view = renderHook(() => useApiResource("shops", load));
  await waitFor(() => expect(view.result.current.resource.status).toBe("error"));
  load.mockResolvedValueOnce("ok");
  act(() => view.result.current.retry());
  await waitFor(() => expect(view.result.current.resource).toEqual({ status: "success", data: "ok" }));
});
