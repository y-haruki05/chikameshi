import { useLayoutEffect, useRef } from "react";

/** SPAの画面遷移を読み上げ・キーボード操作に伝える。再試行時は操作中のフォーカスを奪わない。 */
export function usePageAccessibility(title: string, pageKey: string, ready = true) {
  const mainRef = useRef<HTMLElement>(null);
  const focusedKey = useRef<string | null>(null);
  useLayoutEffect(() => { document.title = `${title} | ちかめし`; }, [title]);
  useLayoutEffect(() => {
    if (!ready) return;
    // 再試行ボタンが読み込みで消えた場合は、bodyに失われたフォーカスを本文へ戻す。
    const focusLost = document.activeElement === document.body || document.activeElement === null;
    if (focusedKey.current === pageKey && !focusLost) return;
    mainRef.current?.focus({ preventScroll: true });
    focusedKey.current = pageKey;
  }, [pageKey, ready]);
  return mainRef;
}
