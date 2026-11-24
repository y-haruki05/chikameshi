import { useEffect, useRef, useState } from "react";

export interface Coordinates { latitude: number; longitude: number }
export type GeolocationState =
  | { status: "idle" | "loading"; coordinates: null; error: null }
  | { status: "success"; coordinates: Coordinates; error: null }
  | { status: "error"; coordinates: null; error: string };

const errors: Record<number, string> = {
  1: "位置情報の利用が許可されていません。ブラウザや端末の設定で許可してから再試行してください。",
  2: "現在地を取得できませんでした。端末の位置情報や通信環境を確認して再試行してください。",
  3: "現在地の取得がタイムアウトしました。通信環境のよい場所で再試行してください。",
};

/** 明示操作時のみ現在地を取得する。取り消し後の遅延コールバックは状態へ反映しない。 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ status: "idle", coordinates: null, error: null });
  // Geolocation API自体は中断できないため、世代番号で以前の要求を無効化する。
  const requestId = useRef(0);
  const pending = useRef(false);
  const watchdog = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearWatchdog = () => {
    if (watchdog.current !== null) clearTimeout(watchdog.current);
    watchdog.current = null;
  };
  useEffect(() => () => { requestId.current += 1; pending.current = false; clearWatchdog(); }, []);

  const cancel = () => {
    clearWatchdog();
    requestId.current += 1;
    if (pending.current) {
      pending.current = false;
      setState({ status: "idle", coordinates: null, error: null });
    }
  };

  const request = () => {
    if (pending.current) return;
    const id = ++requestId.current;
    const fail = (message: string) => {
      if (id !== requestId.current) return;
      clearWatchdog();
      requestId.current += 1;
      pending.current = false;
      setState({ status: "error", coordinates: null, error: message });
    };
    if (!window.isSecureContext) {
      fail("現在地の取得にはHTTPSまたはlocalhostでのアクセスが必要です。スマートフォンからのHTTP接続では利用できません。");
      return;
    }
    if (!navigator.geolocation) {
      fail("このブラウザは位置情報の取得に対応していません。対応ブラウザをご利用ください。");
      return;
    }
    pending.current = true;
    setState({ status: "loading", coordinates: null, error: null });
    // ブラウザのtimeout通知を待つが、通知自体が来ない場合は1秒の余裕後に打ち切る。
    watchdog.current = setTimeout(() => fail(errors[3]), 11_000);
    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (id !== requestId.current) return;
          if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude) || Math.abs(coords.latitude) > 90 || Math.abs(coords.longitude) > 180) {
            fail("有効な現在地を取得できませんでした。再試行してください。");
            return;
          }
          clearWatchdog();
          requestId.current += 1;
          pending.current = false;
          setState({ status: "success", coordinates: { latitude: coords.latitude, longitude: coords.longitude }, error: null });
        },
        ({ code }) => fail(errors[code] ?? "現在地の取得に失敗しました。時間をおいて再試行してください。"),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
      );
    } catch {
      fail("現在地の取得を開始できませんでした。ブラウザの設定を確認して再試行してください。");
    }
  };
  return { ...state, request, cancel };
}
