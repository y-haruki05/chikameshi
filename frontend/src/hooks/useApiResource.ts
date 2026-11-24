import { useEffect, useState } from "react";

type Resource<T> = { status: "loading" } | { status: "success"; data: T } | { status: "error"; error: Error };

// The key prevents the previous route's data flashing before the effect runs.
export function useApiResource<T>(key: string, load: ((signal: AbortSignal) => Promise<T>) | null) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; attempt: number; value: Resource<T> } | null>(null);
  useEffect(() => {
    if (!load) return;
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => { if (!controller.signal.aborted) setResult({ key, attempt, value: { status: "success", data } }); },
      (error: unknown) => { if (!controller.signal.aborted) setResult({ key, attempt, value: { status: "error", error: error instanceof Error ? error : new Error("お店を読み込めませんでした。") } }); },
    );
    return () => controller.abort();
  }, [key, load, attempt]);
  const resource: Resource<T> = result?.key === key && result.attempt === attempt ? result.value : { status: "loading" };
  return { resource, retry: () => setAttempt((previous) => previous + 1) };
}
