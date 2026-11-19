import { ArrowDownRight, ArrowRight, LocateFixed, MapPin, Sparkles, Utensils } from "lucide-react";
import { SearchCondition } from "../components/SearchCondition";
import type { SearchRange } from "../types/demo";

interface HomePageProps {
  range: SearchRange;
  onRangeChange: (range: SearchRange) => void;
  onSearch: () => void;
}

export function HomePage({ range, onRangeChange, onSearch }: HomePageProps) {
  return (
    <main>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-9 sm:px-8 lg:min-h-[650px] lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-8 lg:px-12 lg:pb-24 lg:pt-7">
        <div className="relative z-10 max-w-xl py-5 lg:py-0">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dce8dd] bg-white px-3.5 py-2 text-xs font-semibold tracking-wide text-[#51745a] shadow-sm">
            <Sparkles size={14} aria-hidden="true" />
            今日の「食べたい」に出会う
          </div>
          <p className="mb-4 text-sm font-semibold tracking-[0.16em] text-[#bc5a3a]">A LITTLE CLOSER, A LOT TASTIER.</p>
          <h1 className="text-[2.65rem] font-semibold leading-[1.17] tracking-[-0.055em] text-[#202b25] sm:text-5xl lg:text-[3.65rem]">
            今いる場所から、<br />近くのおいしい<br />お店を見つける<span className="text-[#c75d3e]">。</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#6b756e] sm:text-base">
            いつもの街にも、まだ知らない一軒がある。気分にぴったりのお店を、近くから探してみませんか。
          </p>

          <div className="mt-8 max-w-lg rounded-[1.65rem] border border-[#e8e7df] bg-white p-5 shadow-[0_18px_55px_-35px_rgba(32,43,37,0.35)] sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf3eb] text-[#55775d]">
                <LocateFixed size={19} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#26332b]">現在地の近くから探す</p>
                <p className="mt-0.5 text-xs text-[#858d85]">近くのレストランを距離で見つけます</p>
              </div>
              <span className="ml-auto hidden rounded-full bg-[#f7f4ed] px-2.5 py-1 text-[10px] font-semibold text-[#8e7855] sm:inline-flex">サンプル表示</span>
            </div>
            <SearchCondition value={range} onChange={onRangeChange} />
            <button
              type="button"
              onClick={onSearch}
              className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#c75d3e] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(168,67,42,0.8)] transition hover:bg-[#ad4e33] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e8b5a5] active:translate-y-px"
            >
              近くのお店を探す <ArrowRight size={17} aria-hidden="true" />
            </button>
            <p className="mt-3 text-center text-[11px] leading-5 text-[#929990]">現在地の利用は、ブラウザの許可後に行います</p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[610px] lg:ml-auto lg:mr-0">
          <div className="absolute -right-2 top-3 size-24 rounded-full bg-[#f1d8c8] sm:-right-4 sm:size-32" />
          <div className="absolute -left-2 bottom-7 size-20 rounded-full bg-[#dfe9d8] sm:-left-5 sm:size-28" />
          <div className="relative grid grid-cols-[1.14fr_0.86fr] items-center gap-3 sm:gap-4">
            <figure className="relative overflow-hidden rounded-[1.65rem] shadow-[0_25px_55px_-33px_rgba(32,43,37,0.6)] sm:rounded-[2rem]">
              <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=85" alt="彩り豊かな料理のサンプル写真" className="aspect-[0.83] w-full object-cover" />
              <figcaption className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-medium text-[#58645b] backdrop-blur sm:bottom-4 sm:left-4 sm:text-xs">写真はイメージです</figcaption>
            </figure>
            <div className="space-y-3 sm:space-y-4">
              <figure className="overflow-hidden rounded-[1.4rem] shadow-[0_20px_45px_-32px_rgba(32,43,37,0.55)] sm:rounded-[1.7rem]">
                <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=85" alt="落ち着いた雰囲気のレストランのサンプル写真" className="aspect-[1.22] w-full object-cover" />
              </figure>
              <div className="rounded-[1.4rem] border border-[#e8e7df] bg-white p-4 shadow-[0_16px_38px_-28px_rgba(32,43,37,0.45)] sm:rounded-[1.7rem] sm:p-5">
                <div className="mb-4 flex items-center gap-2 text-[#63816a]"><MapPin size={15} aria-hidden="true" /><span className="text-[10px] font-bold tracking-[0.12em] sm:text-xs">NEAR YOU</span></div>
                <p className="text-sm font-semibold leading-6 text-[#26332b] sm:text-base">お気に入りの一軒、<br className="sm:hidden" />すぐそばに。</p>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-[#858d85]"><span className="flex size-6 items-center justify-center rounded-full bg-[#f7eee8] text-[#c75d3e]"><Utensils size={12} aria-hidden="true" /></span>街の小さなお店も</div>
              </div>
              <figure className="hidden overflow-hidden rounded-[1.4rem] shadow-[0_20px_45px_-32px_rgba(32,43,37,0.55)] sm:block sm:rounded-[1.7rem]">
                <img src="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=700&q=85" alt="あたたかな照明の店内のサンプル写真" className="aspect-[1.85] w-full object-cover" />
              </figure>
            </div>
          </div>
          <div className="absolute -bottom-5 left-2 flex items-center gap-2 rounded-full border border-[#e8e7df] bg-white px-3 py-2 text-[11px] font-medium text-[#526257] shadow-lg sm:bottom-5 sm:left-[-2.25rem] sm:px-4 sm:py-2.5 sm:text-xs">
            <span className="size-2 rounded-full bg-[#83a17e]" />今日のランチ、もう決まった？<ArrowDownRight size={14} aria-hidden="true" />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[#eeede7] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-3 md:gap-10 md:py-16 lg:px-12">
          {[
            { number: "01", title: "近くのお店を探す", text: "今いる場所を中心に、行きやすいお店を見つけます。" },
            { number: "02", title: "気になる一軒を選ぶ", text: "写真やアクセスを見比べて、今日の気分に合わせて。" },
            { number: "03", title: "お店へ出かける", text: "詳しい営業時間や予約は、お店のページで確認できます。" },
          ].map((step) => (
            <div key={step.number} className="flex gap-4">
              <span className="pt-0.5 text-xs font-bold tracking-[0.12em] text-[#c75d3e]">{step.number}</span>
              <div><h2 className="text-sm font-semibold text-[#26332b]">{step.title}</h2><p className="mt-2 text-xs leading-6 text-[#858d85]">{step.text}</p></div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
