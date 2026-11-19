import { useEffect, useState } from "react";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { DetailPage } from "./pages/DetailPage";
import { HomePage } from "./pages/HomePage";
import { ResultsPage } from "./pages/ResultsPage";
import type { DemoView, SearchRange } from "./types/demo";
import { isSearchRange } from "./types/demo";

type Route =
  | { name: "home" }
  | { name: "results"; range: SearchRange; page: number; demoView: DemoView }
  | { name: "detail"; shopId: string; range: SearchRange; page: number };

function getRoute(): Route {
  const url = new URL(window.location.href);
  const rangeValue = Number(url.searchParams.get("range"));
  const range = isSearchRange(rangeValue) ? rangeValue : 3;
  const pageValue = Number(url.searchParams.get("page"));
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;

  if (url.pathname === "/search") {
    const demoValue = url.searchParams.get("demo");
    const demoView: DemoView = demoValue === "empty" || demoValue === "error" || demoValue === "loading"
      ? demoValue
      : "success";
    return { name: "results", range, page, demoView };
  }

  const detailMatch = url.pathname.match(/^\/shop\/([^/]+)$/);
  if (detailMatch) {
    return { name: "detail", shopId: decodeURIComponent(detailMatch[1]), range, page };
  }

  return { name: "home" };
}

export default function App() {
  const [route, setRoute] = useState<Route>(getRoute);
  const [selectedRange, setSelectedRange] = useState<SearchRange>(3);

  useEffect(() => {
    const updateRoute = () => setRoute(getRoute());
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  useEffect(() => {
    if (route.name === "results" || route.name === "detail") setSelectedRange(route.range);
  }, [route]);

  const navigate = (href: string) => {
    window.history.pushState({}, "", href);
    setRoute(getRoute());
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  let content;
  if (route.name === "results") {
    content = (
      <ResultsPage
        range={route.range}
        page={route.page}
        demoView={route.demoView}
        onSearch={(range) => navigate(`/search?range=${range}&page=1`)}
        onPageChange={(page) => navigate(`/search?range=${route.range}&page=${page}`)}
        onSelectShop={(shopId) => navigate(`/shop/${encodeURIComponent(shopId)}?range=${route.range}&page=${route.page}`)}
        onGoHome={() => navigate("/")}
      />
    );
  } else if (route.name === "detail") {
    content = (
      <DetailPage
        shopId={route.shopId}
        onBack={() => navigate(`/search?range=${route.range}&page=${route.page}`)}
        onGoHome={() => navigate("/")}
      />
    );
  } else {
    content = (
      <HomePage
        range={selectedRange}
        onRangeChange={setSelectedRange}
        onSearch={() => navigate(`/search?range=${selectedRange}&page=1`)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#202b25]">
      <SiteHeader onNavigate={navigate} />
      {content}
      <SiteFooter />
    </div>
  );
}
