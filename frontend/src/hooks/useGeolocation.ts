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

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ status: "idle", coordinates: null, error: null });
  const requestId = useRef(0);
  const pending = useRef(false);
  useEffect(() => () => { requestId.current += 1; pending.current = false; }, []);

  const cancel = () => {
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
    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (id !== requestId.current) return;
          if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude) || Math.abs(coords.latitude) > 90 || Math.abs(coords.longitude) > 180) {
            fail("有効な現在地を取得できませんでした。再試行してください。");
            return;
          }
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
