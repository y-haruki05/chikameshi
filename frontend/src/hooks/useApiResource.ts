import { useEffect, useRef, useState } from "react";

type Resource<T> = { status: "loading" } | { status: "success"; data: T } | { status: "error"; error: Error };

/** 検索条件や店舗IDごとに取得を管理し、前の画面の結果や遅れて届いた応答を表示しない。 */
export function useApiResource<T>(key: string, load: ((signal: AbortSignal) => Promise<T>) | null) {
  const [attempt, setAttempt] = useState(0);
  const active = useRef<AbortController | null>(null);
  const retryQueued = useRef(false);
  const [result, setResult] = useState<{ key: string; attempt: number; value: Resource<T> } | null>(null);
  useEffect(() => {
    retryQueued.current = false;
    if (!load) return;
    const controller = new AbortController();
    active.current = controller;
    async function run() {
      try {
        const data = await load!(controller.signal);
        if (!controller.signal.aborted) setResult({ key, attempt, value: { status: "success", data } });
      } catch (error: unknown) {
        if (!controller.signal.aborted) setResult({ key, attempt, value: { status: "error", error: error instanceof Error ? error : new Error("お店を読み込めませんでした。") } });
      } finally {
        if (active.current === controller) active.current = null;
      }
    }
    void run();
    return () => {
      controller.abort();
      if (active.current === controller) active.current = null;
    };
  }, [key, load, attempt]);
  const resource: Resource<T> = result?.key === key && result.attempt === attempt ? result.value : { status: "loading" };
  const retry = () => {
    // state反映前の連打も抑止し、進行中の取得を同じ条件で重複させない。
    if (!load || active.current || retryQueued.current) return;
    retryQueued.current = true;
    setAttempt((previous) => previous + 1);
  };
  return { resource, retry };
}
