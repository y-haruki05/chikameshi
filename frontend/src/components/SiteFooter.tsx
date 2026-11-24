import { ArrowUpRight, Heart, UtensilsCrossed } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#e9e7df] bg-[#f6f5f0]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
        <div>
          <a href="/" className="inline-flex items-center gap-2 text-sm font-bold tracking-[-0.04em] text-[#2b372f]">
            <UtensilsCrossed size={16} className="text-[#c75d3e]" aria-hidden="true" /> ちかめし
          </a>
          <p className="mt-2 flex items-center gap-1 text-[11px] text-[#858d85]">近くのおいしいに出会う、小さなきっかけ。 <Heart size={11} className="text-[#c75d3e]" aria-hidden="true" /></p>
        </div>
        <div className="text-[11px] text-[#777f77]">
          <a href="https://webservice.recruit.co.jp/" target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1 font-medium text-[#58645b] underline decoration-[#aab5aa] underline-offset-4 hover:text-[#a84f35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c75d3e]">
            Powered by ホットペッパーグルメ Webサービス <ArrowUpRight size={12} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
