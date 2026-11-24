import { ArrowLeft, ChevronDown, MapPin, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { Pagination } from "../components/Pagination";
import { SearchCondition } from "../components/SearchCondition";
import { ShopCard } from "../components/ShopCard";
import { searchShops } from "../services/shopApi";
import { useApiResource } from "../hooks/useApiResource";
import { SEARCH_RANGE_LABELS } from "../types/demo";
import type { SearchRange } from "../types/demo";

import type { Coordinates } from "../hooks/useGeolocation";

const PAGE_SIZE = 12;
interface ResultsPageProps {
  coordinates: Coordinates | null;
  range: SearchRange; page: number;
  onReady?: () => void;
  onSearch: (range: SearchRange) => void;
  onPageChange: (page: number) => void; onSelectShop: (shopId: string) => void; onGoHome: () => void;
}

export function ResultsPage({ coordinates, range, page, onSearch, onPageChange, onSelectShop, onGoHome, onReady }: ResultsPageProps) {
  const filtersRef = useRef<HTMLDivElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(range);
  useEffect(() => setSelectedRange(range), [range]);
  const lat = coordinates?.latitude;
  const lng = coordinates?.longitude;
  const start = (page - 1) * PAGE_SIZE + 1;
  const validPage = Number.isSafeInteger(start) && start > 0;
  const load = useCallback(async (signal: AbortSignal) => {
    if (lat === undefined || lng === undefined) throw new Error("現在地を取得してください。");
    return searchShops({ lat, lng, range, start, count: PAGE_SIZE }, signal);
  }, [lat, lng, range, start]);
  const { resource, retry } = useApiResource(`${lat}:${lng}:${range}:${page}`, coordinates && validPage ? load : null);
  const applySearch = () => {
    if (selectedRange === range && page === 1) retry();
    else onSearch(selectedRange);
  };
  const pageCount = resource.status === "success" ? Math.ceil(resource.data.pagination.total / resource.data.pagination.count) : 0;
  const outOfRange = !validPage || (resource.status === "success" && page > Math.max(1, pageCount));
  useLayoutEffect(() => {
    if (!coordinates || !validPage || resource.status !== "loading") onReady?.();
  }, [coordinates, validPage, resource.status, onReady]);
  const changeRange = () => {
    setFiltersOpen(true);
    requestAnimationFrame(() => {
      filtersRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      filtersRef.current?.querySelector<HTMLInputElement>("input:checked")?.focus({ preventScroll: true });
    });
  };
  return <main className="mx-auto min-h-[70vh] max-w-7xl px-5 pb-14 pt-8 sm:px-8 sm:pt-11 lg:px-12">
    <a href="/" onClick={(event) => { event.preventDefault(); onGoHome(); }} className="inline-flex items-center gap-1.5 rounded-lg text-xs font-medium text-[#778078] hover:text-[#a84f35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c75d3e]"><ArrowLeft size={14} aria-hidden="true" />ホームへ戻る</a>
    <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
      <div><p className="flex items-center gap-1.5 text-xs font-medium text-[#718071]"><MapPin size={14} aria-hidden="true" />検索範囲：{SEARCH_RANGE_LABELS[range]} 以内</p><div className="mt-2"><h1 className="text-2xl font-semibold tracking-[-0.04em] text-[#27342c] sm:text-3xl">お店一覧</h1></div>{coordinates && resource.status === "success" && <p className="mt-2 text-sm text-[#7b847c]" aria-live="polite">{resource.data.pagination.total === 0 ? "0件" : outOfRange ? `全${resource.data.pagination.total}件` : `全${resource.data.pagination.total}件中${start}〜${start + resource.data.shops.length - 1}件を表示`}</p>}</div>
      <div className="rounded-2xl border border-[#e9e7df] bg-white p-4">
        <button type="button" aria-expanded={filtersOpen} aria-controls="search-filters" onClick={() => setFiltersOpen((open) => !open)} className="group flex min-h-11 w-full items-center justify-between rounded-xl border border-[#e8e7df] bg-[#fbfaf7] px-3 text-sm font-semibold text-[#46564a] transition hover:border-[#c6d2c5] hover:bg-[#f3f6f1] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dce8dd]"><span className="inline-flex items-center gap-2"><SlidersHorizontal size={16} aria-hidden="true" />検索範囲を変更</span><span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8d3c8] bg-white px-2.5 py-1 text-xs font-semibold text-[#a84f35] transition group-hover:border-[#cf9d88]">{SEARCH_RANGE_LABELS[range]}<ChevronDown size={13} className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`} aria-hidden="true" /></span></button>
        <div ref={filtersRef} id="search-filters" hidden={!filtersOpen} className="mt-3"><SearchCondition compact value={selectedRange} onChange={setSelectedRange} /><button type="button" onClick={applySearch} className="mt-3 min-h-10 w-full rounded-xl bg-[#27342c] text-xs font-semibold text-white hover:bg-[#405245] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c6d7c4]">この範囲で表示</button></div>
      </div>
    </div>
    <div className="mt-8" aria-live="polite">
      {!coordinates ? <section className="rounded-2xl border border-[#e9e7df] bg-white p-8 text-center"><p className="text-sm text-[#68736a]">現在地を取得してお店を探してください。</p><button type="button" onClick={onGoHome} className="mt-5 min-h-11 rounded-xl bg-[#27342c] px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c6d7c4]">現在地を取得する</button></section>
      : outOfRange ? <section className="rounded-2xl border border-[#e9e7df] bg-white p-8 text-center"><h2 className="text-lg font-semibold text-[#27342c]">ページが見つかりませんでした</h2><button type="button" onClick={() => onPageChange(1)} className="mt-5 min-h-11 rounded-xl bg-[#27342c] px-5 text-sm font-semibold text-white focus-visible:ring-4 focus-visible:ring-[#c6d7c4]">最初のページへ</button></section>
      : resource.status === "loading" ? <LoadingState />
      : resource.status === "error" ? <ErrorMessage message={resource.error.message} onRetry={retry} />
      : resource.data.shops.length === 0 ? <EmptyState onRetry={applySearch} onChangeRange={changeRange} />
      : <><section aria-label="検索結果のお店" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{resource.data.shops.map((shop) => <ShopCard key={shop.id} shop={shop} onSelect={onSelectShop} />)}</section><Pagination page={page} pageCount={pageCount} onChange={onPageChange} /></>}
    </div>
  </main>;
}
