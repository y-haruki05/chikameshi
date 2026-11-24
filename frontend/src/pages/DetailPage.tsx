import { useCallback, useLayoutEffect, type ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, Clock3, ExternalLink, MapPin, Users, Wallet, type LucideIcon } from "lucide-react";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { ShopImage } from "../components/ShopImage";
import { useApiResource } from "../hooks/useApiResource";
import { usePageAccessibility } from "../hooks/usePageAccessibility";
import { safeHttpUrl } from "../services/safeUrl";
import { getShop, ShopApiError } from "../services/shopApi";
import { shopText } from "../services/shopText";

interface DetailPageProps {
  shopId: string;
  onReady?: () => void;
  onBack: () => void;
  onGoHome: () => void;
}

function DetailRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-3 py-4 text-sm sm:grid-cols-[115px_minmax(0,1fr)]">
      <dt className="flex items-center gap-2 text-xs font-medium text-[#656b65]">
        <Icon size={15} className="shrink-0" aria-hidden="true" />{label}
      </dt>
      <dd className="min-w-0 break-words leading-6 text-[#414e45]">{children}</dd>
    </div>
  );
}

/** 詳細URLは店舗IDだけで取得でき、現在地や前の検索に依存しない。 */
export function DetailPage({ shopId, onBack, onGoHome, onReady }: DetailPageProps) {
  const validId = /^J[0-9]{9}$/.test(shopId);
  const load = useCallback((signal: AbortSignal) => getShop(shopId, signal), [shopId]);
  const { resource, retry } = useApiResource(shopId, validId ? load : null);
  const shop = validId && resource.status === "success" ? resource.data : null;
  const ready = !validId || resource.status !== "loading";
  const mainRef = usePageAccessibility(shop ? shopText(shop.name, "店舗詳細") : "店舗詳細", shopId, ready);
  useLayoutEffect(() => { if (ready) onReady?.(); }, [ready, onReady]);

  let content;
  if (!ready) {
    content = <LoadingState />;
  } else if (resource.status === "error" && validId && !(resource.error instanceof ShopApiError && resource.error.status === 404)) {
    const canRetry = !(resource.error instanceof ShopApiError) || resource.error.retryable;
    content = <ErrorMessage message={resource.error.message} onRetry={canRetry ? retry : undefined} />;
  } else if (!shop) {
    content = (
      <section className="py-10 text-center">
        <h1 className="text-lg font-semibold text-[#27342c]">お店が見つかりませんでした。</h1>
        <button type="button" onClick={onGoHome} className="mt-5 min-h-11 rounded-xl border border-[#e8e7df] px-5 py-3 text-sm font-semibold text-[#58645b] focus-visible:ring-2 focus-visible:ring-[#c75d3e]">ホームへ</button>
      </section>
    );
  } else {
    const shopUrl = safeHttpUrl(shop.urls?.pc);
    content = (
      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start lg:gap-12">
        <ShopImage shop={shop} sizes="(min-width: 1024px) 58vw, 95vw" className="aspect-[1.32] w-full rounded-[1.6rem] sm:rounded-[2rem]" />
        <section className="min-w-0 pt-1" aria-labelledby="shop-title">
          <p className="text-xs font-semibold tracking-wide text-[#925f47]">{shopText(shop.genre?.name, "レストラン")}</p>
          <h1 id="shop-title" className="mt-2 break-words text-2xl font-semibold leading-tight tracking-[-0.04em] text-[#27342c] sm:text-3xl">{shopText(shop.name, "店舗名不明")}</h1>
          {shopText(shop.genre?.catch) && <p className="mt-3 text-sm leading-6 text-[#656b65]">{shopText(shop.genre?.catch)}</p>}
          <dl className="mt-6 divide-y divide-[#eeede7] rounded-2xl border border-[#e9e7df] bg-white px-4 sm:px-5">
            <DetailRow icon={MapPin} label="住所・アクセス">
              {shopText(shop.address, "住所情報なし")}
              <span className="block text-xs text-[#656b65]">{shopText(shop.access)}</span>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.lat},${shop.lng}`)}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-lg border border-[#dce5d8] bg-[#f5f7f2] px-3 text-xs font-semibold text-[#4d6853] hover:bg-[#eaf0e7] focus-visible:ring-4 focus-visible:ring-[#dce8dd]">
                <MapPin size={13} aria-hidden="true" />地図で見る<ExternalLink size={12} aria-hidden="true" /><span className="sr-only">（新しいタブ）</span>
              </a>
            </DetailRow>
            <DetailRow icon={Clock3} label="営業時間">
              {shopText(shop.open, "店舗にお問い合わせください")}
              <span className="block text-xs text-[#656b65]">定休日：{shopText(shop.close, "店舗にお問い合わせください")}</span>
            </DetailRow>
            <DetailRow icon={Wallet} label="予算">{shopText(shop.budget?.average, shopText(shop.budget?.name, "予算情報なし"))}</DetailRow>
            <DetailRow icon={Users} label="席数">{shop.capacity === undefined ? "店舗にお問い合わせください" : `${shop.capacity}席`}</DetailRow>
          </dl>
          {shopUrl && (
            <a href={shopUrl} target="_blank" rel="noopener noreferrer" className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#b65336] px-5 text-sm font-semibold text-white hover:bg-[#ad4e33] focus-visible:ring-4 focus-visible:ring-[#e8b5a5]">
              ホットペッパーグルメを見る<ArrowUpRight size={16} aria-hidden="true" /><span className="sr-only">（新しいタブ）</span>
            </a>
          )}
        </section>
      </div>
    );
  }

  return (
    <main ref={mainRef} id="main-content" tabIndex={-1} aria-busy={!ready} className="mx-auto min-h-[70vh] max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pt-11 lg:px-12">
      <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium text-[#626e65] hover:text-[#a84f35] focus-visible:ring-2 focus-visible:ring-[#c75d3e]">
        <ArrowLeft size={16} aria-hidden="true" />{!shop && ready && resource.status !== "error" ? "検索結果へ戻る" : "検索結果に戻る"}
      </button>
      {content}
    </main>
  );
}
