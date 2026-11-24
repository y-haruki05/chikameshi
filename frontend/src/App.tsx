import { useEffect, useRef, useState } from "react";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { DetailPage } from "./pages/DetailPage";
import { HomePage } from "./pages/HomePage";
import { ResultsPage } from "./pages/ResultsPage";
import type { SearchRange } from "./types/demo";
import { isSearchRange } from "./types/demo";

import { useGeolocation } from "./hooks/useGeolocation";
import type { Coordinates } from "./hooks/useGeolocation";

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
  // Keep coordinates in memory, never in the page URL or history state.
  const sessions = useRef(new Map<string, Coordinates>());
  const [sessionId, setSessionId] = useState<string | null>(getSessionId);
  const searchCoordinates = sessionId ? sessions.current.get(sessionId) ?? null : null;
  const [route, setRoute] = useState<Route>(getRoute);
  const [selectedRange, setSelectedRange] = useState<SearchRange>(3);

  useEffect(() => {
    const updateRoute = () => { geolocation.cancel(); setRoute(getRoute()); setSessionId(getSessionId()); };
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  useEffect(() => {
    if (route.name === "results" || route.name === "detail") setSelectedRange(route.range);
  }, [route]);

  const navigate = (href: string, searchSessionId: string | null = null) => {
    geolocation.cancel();
    window.history.pushState(searchSessionId ? { searchSessionId } : {}, "", href);
    setSessionId(searchSessionId);
    setRoute(getRoute());
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const startSearch = (coordinates: Coordinates | null) => {
    if (!coordinates) return;
    const id = Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(16)).join("-");
    sessions.current.set(id, coordinates);
    // Bound retained location history; older entries require a fresh location.
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
        coordinates={searchCoordinates}
        range={route.range}
        page={route.page}
        onSearch={(range) => navigate(`/search?range=${range}&page=1`, sessionId)}
        onPageChange={(page) => navigate(`/search?range=${route.range}&page=${page}`, sessionId)}
        onSelectShop={(shopId) => navigate(`/shop/${encodeURIComponent(shopId)}?range=${route.range}&page=${route.page}`, sessionId)}
        onGoHome={() => navigate("/")}
      />
    );
  } else if (route.name === "detail") {
    content = (
      <DetailPage
        shopId={route.shopId}
        onBack={() => navigate(`/search?range=${route.range}&page=${route.page}`, sessionId)}
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
      <SiteHeader onNavigate={(href) => navigate(href)} />
      {content}
      <SiteFooter />
    </div>
  );
}
