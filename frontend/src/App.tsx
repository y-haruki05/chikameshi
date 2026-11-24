import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { DetailPage } from "./pages/DetailPage";
import { HomePage } from "./pages/HomePage";
import { ResultsPage } from "./pages/ResultsPage";
import type { SearchRange } from "./types/search";
import { isSearchRange } from "./types/search";

import { useGeolocation } from "./hooks/useGeolocation";
import type { Coordinates } from "./hooks/useGeolocation";

function createEntryKey() {
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(16)).join("-");
}

type Route =
  | { name: "home" }
  | { name: "results"; range: SearchRange; page: number }
  | { name: "detail"; shopId: string; range: SearchRange; page: number };

function getRoute(): Route {
  const url = new URL(window.location.href);
  const rangeValue = Number(url.searchParams.get("range"));
  const range = isSearchRange(rangeValue) ? rangeValue : 3;
  const pageValue = Number(url.searchParams.get("page"));
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;

  if (url.pathname === "/search") {
    return { name: "results", range, page };
  }

  const detailMatch = url.pathname.match(/^\/shop\/([^/]+)$/);
  if (detailMatch) {
    return { name: "detail", shopId: decodeShopId(detailMatch[1]), range, page };
  }

  return { name: "home" };
}

function decodeShopId(value: string): string {
  try { return decodeURIComponent(value); } catch { return ""; }
}

function getSessionId(): string | null {
  const state: unknown = window.history.state;
  return typeof state === "object" && state !== null && "searchSessionId" in state
    && typeof state.searchSessionId === "string" ? state.searchSessionId : null;
}

export default function App() {
  const geolocation = useGeolocation();
  // 位置情報を履歴・URL・永続ストレージに残さず、共有やログ経由の漏洩を防ぐ。
  const sessions = useRef(new Map<string, Coordinates>());
  const [sessionId, setSessionId] = useState<string | null>(getSessionId);
  const searchCoordinates = sessionId ? sessions.current.get(sessionId) ?? null : null;
  const [route, setRoute] = useState<Route>(getRoute);
  const entryKey = useRef("");
  if (!entryKey.current) entryKey.current = createEntryKey();
  const scrollPositions = useRef(new Map<string, number>());
  const pendingScroll = useRef<number | null>(null);
  const [selectedRange, setSelectedRange] = useState<SearchRange>(3);

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.history.replaceState({ ...window.history.state, entryKey: entryKey.current }, "");
    const updateRoute = () => {
      if (pendingScroll.current === null) scrollPositions.current.set(entryKey.current, window.scrollY);
      entryKey.current = window.history.state?.entryKey ?? createEntryKey();
      pendingScroll.current = scrollPositions.current.get(entryKey.current) ?? 0;
      geolocation.cancel();
      setRoute(getRoute());
      setSessionId(getSessionId());
    };
    window.addEventListener("popstate", updateRoute);
    return () => {
      window.removeEventListener("popstate", updateRoute);
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  // ローディング中は高さが足りないため、データが表示された後に一度だけ位置を戻す。
  const restoreScroll = useCallback(() => {
    if (pendingScroll.current === null) return;
    window.scrollTo({ top: pendingScroll.current, behavior: "instant" });
    pendingScroll.current = null;
  }, [route]);
  useLayoutEffect(() => {
    if (route.name === "home") {
      restoreScroll();
      if (window.location.hash === "#how-it-works") document.getElementById("how-it-works")?.scrollIntoView({ block: "start" });
    }
  }, [route.name, restoreScroll]);

  useEffect(() => {
    if (route.name === "results" || route.name === "detail") setSelectedRange(route.range);
  }, [route]);

  const navigate = (href: string, searchSessionId: string | null = null, fromResults = false) => {
    geolocation.cancel();
    if (pendingScroll.current === null) scrollPositions.current.set(entryKey.current, window.scrollY);
    const returnEntryKey = fromResults ? entryKey.current : undefined;
    entryKey.current = createEntryKey();
    pendingScroll.current = 0;
    window.history.pushState({ ...(searchSessionId ? { searchSessionId } : {}), entryKey: entryKey.current, ...(returnEntryKey ? { returnEntryKey } : {}) }, "", href);
    setSessionId(searchSessionId);
    setRoute(getRoute());
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const startSearch = (coordinates: Coordinates | null) => {
    if (!coordinates) return;
    const id = createEntryKey();
    sessions.current.set(id, coordinates);
    // メモリに保持する位置情報を20検索に制限し、古い履歴では再取得を求める。
    if (sessions.current.size > 20) {
      const oldest = sessions.current.keys().next().value;
      if (oldest !== undefined) sessions.current.delete(oldest);
    }
    navigate(`/search?range=${selectedRange}&page=1`, id);
  };

  let content;
  if (route.name === "results") {
    content = (
      <ResultsPage
        onReady={restoreScroll}
        coordinates={searchCoordinates}
        range={route.range}
        page={route.page}
        onSearch={(range) => navigate(`/search?range=${range}&page=1`, sessionId)}
        onPageChange={(page) => navigate(`/search?range=${route.range}&page=${page}`, sessionId)}
        onSelectShop={(shopId) => navigate(`/shop/${encodeURIComponent(shopId)}?range=${route.range}&page=${route.page}`, sessionId, true)}
        onGoHome={() => navigate("/")}
      />
    );
  } else if (route.name === "detail") {
    content = (
      <DetailPage
        onReady={restoreScroll}
        shopId={route.shopId}
        onBack={() => {
          const returnKey: unknown = window.history.state?.returnEntryKey;
          if (typeof returnKey === "string" && scrollPositions.current.has(returnKey)) window.history.back();
          else navigate(`/search?range=${route.range}&page=${route.page}`, sessionId);
        }}
        onGoHome={() => navigate("/")}
      />
    );
  } else {
    content = (
      <HomePage
        geolocation={geolocation}
        range={selectedRange}
        onRangeChange={setSelectedRange}
        onSearch={() => startSearch(geolocation.coordinates)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#202b25]">
      <a href="#main-content" className="skip-link">本文へ移動</a>
      <SiteHeader onNavigate={(href) => navigate(href)} />
      {content}
      <SiteFooter onNavigate={() => navigate("/")} />
    </div>
  );
}
