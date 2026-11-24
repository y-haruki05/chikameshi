import { ArrowLeft, ArrowUpRight, Clock3, ExternalLink, MapPin, Users, Wallet } from "lucide-react";
import { ShopImage } from "../components/ShopImage";
import { useCallback } from "react";
import { getShop, ShopApiError } from "../services/shopApi";
import { safeHttpUrl } from "../services/safeUrl";
import { useApiResource } from "../hooks/useApiResource";
import { LoadingState } from "../components/LoadingState";
import { ErrorMessage } from "../components/ErrorMessage";

interface DetailPageProps { shopId: string; onBack: () => void; onGoHome: () => void; }

export function DetailPage({ shopId, onBack, onGoHome }: DetailPageProps) {
  const validId = /^J[0-9]{9}$/.test(shopId);
  const load = useCallback((signal: AbortSignal) => getShop(shopId, signal), [shopId]);
  const { resource, retry } = useApiResource(shopId, validId ? load : null);
  if (validId && resource.status === "loading") return <main className="mx-auto max-w-7xl px-5 py-10"><LoadingState /></main>;
  if (validId && resource.status === "error" && !(resource.error instanceof ShopApiError && resource.error.status === 404)) return <main className="mx-auto max-w-7xl px-5 py-10"><ErrorMessage message={resource.error.message} onRetry={retry} /><button type="button" onClick={onBack} className="mt-5 min-h-11 rounded-xl px-5 text-sm underline focus-visible:ring-2 focus-visible:ring-[#c75d3e]">検索結果に戻る</button></main>;
  const shop = validId && resource.status === "success" ? resource.data : null;
  if (!shop) return <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-16 text-center"><p className="text-[#68736a]">お店が見つかりませんでした。</p><button type="button" onClick={onBack} className="mt-5 rounded-xl bg-[#27342c] px-5 py-3 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c6d7c4]">検索結果へ戻る</button><button type="button" onClick={onGoHome} className="ml-3 rounded-xl border border-[#e8e7df] px-5 py-3 text-sm font-semibold text-[#58645b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c75d3e]">ホームへ</button></main>;
  return <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pt-11 lg:px-12">
    <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-medium text-[#69756c] hover:text-[#a84f35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c75d3e]"><ArrowLeft size={16} aria-hidden="true" />検索結果に戻る</button>
    <div className="mt-5 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-12">
      <div><ShopImage shop={shop} sizes="(min-width: 1024px) 58vw, 95vw" className="aspect-[1.32] w-full rounded-[1.6rem] sm:rounded-[2rem]" /></div>
      <section className="pt-1" aria-labelledby="shop-title"><p className="text-xs font-semibold tracking-wide text-[#a16a50]">{shop.genre?.name ?? "レストラン"}</p><h1 id="shop-title" className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.04em] text-[#27342c] sm:text-3xl">{shop.name}</h1>{shop.genre?.catch && <p className="mt-3 text-sm leading-6 text-[#778078]">{shop.genre.catch}</p>}
        <dl className="mt-6 divide-y divide-[#eeede7] rounded-2xl border border-[#e9e7df] bg-white px-4 sm:px-5">
          <div className="grid grid-cols-[115px_minmax(0,1fr)] gap-3 py-4 text-sm"><dt className="flex items-center gap-2 text-xs font-medium text-[#818a82]"><MapPin size={15} aria-hidden="true" />住所・アクセス</dt><dd className="min-w-0 leading-6 text-[#414e45]">{shop.address}<span className="block text-xs text-[#818a82]">{shop.access}</span><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name} ${shop.address}`)}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-lg border border-[#dce5d8] bg-[#f5f7f2] px-3 text-xs font-semibold text-[#4d6853] transition hover:border-[#aebfab] hover:bg-[#eaf0e7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dce8dd]"><MapPin size={13} aria-hidden="true" />地図で見る<ExternalLink size={12} aria-hidden="true" /><span className="font-normal text-[#778078]">外部サイト</span></a></dd></div>
          <div className="grid grid-cols-[115px_1fr] gap-3 py-4 text-sm"><dt className="flex items-center gap-2 text-xs font-medium text-[#818a82]"><Clock3 size={15} aria-hidden="true" />営業時間</dt><dd className="leading-6 text-[#414e45]">{shop.open ?? "店舗にお問い合わせください"}<span className="block text-xs text-[#818a82]">定休日：{shop.close ?? "店舗にお問い合わせください"}</span></dd></div>
          <div className="grid grid-cols-[115px_1fr] gap-3 py-4 text-sm"><dt className="flex items-center gap-2 text-xs font-medium text-[#818a82]"><Wallet size={15} aria-hidden="true" />予算</dt><dd className="leading-6 text-[#414e45]">{shop.budget?.name ?? "情報なし"}<span className="block text-xs text-[#818a82]">平均 {shop.budget?.average ?? "情報なし"}</span></dd></div>
          <div className="grid grid-cols-[115px_1fr] gap-3 py-4 text-sm"><dt className="flex items-center gap-2 text-xs font-medium text-[#818a82]"><Users size={15} aria-hidden="true" />席数</dt><dd className="text-[#414e45]">{shop.capacity === undefined ? "店舗にお問い合わせください" : `${shop.capacity}席`}</dd></div>
        </dl>
        {safeHttpUrl(shop.urls?.pc) && <a href={safeHttpUrl(shop.urls?.pc)} target="_blank" rel="noreferrer" className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c75d3e] px-5 text-sm font-semibold text-white transition hover:bg-[#ad4e33] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e8b5a5]">ホットペッパーグルメを見る <ArrowUpRight size={16} aria-hidden="true" /></a>}
      </section>
    </div>
  </main>;
}
