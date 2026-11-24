import { ArrowUpRight, MapPin, Wallet } from "lucide-react";
import type { Shop } from "../types/shop";
import { ShopImage } from "./ShopImage";

interface ShopCardProps {
  shop: Shop;
  onSelect: (id: string) => void;
}

export function ShopCard({ shop, onSelect }: ShopCardProps) {
  return (
    <article className="group overflow-hidden rounded-[1.35rem] border border-[#e9e7df] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#d5d9cf] hover:shadow-[0_18px_42px_-30px_rgba(32,43,37,0.42)]">
      <button type="button" onClick={() => onSelect(shop.id)} className="block w-full text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#d9937b]" aria-label={`${shop.name}の詳細を見る`}>
        <div className="relative overflow-hidden">
          <ShopImage shop={shop} className="aspect-[1.58] w-full transition duration-500 group-hover:scale-[1.025]" sizes="(min-width: 900px) 42vw, 90vw" />
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-wide text-[#a16a50]">{shop.genre?.name ?? "レストラン"}</p>
              <h3 className="mt-1.5 text-[16px] font-semibold leading-snug tracking-[-0.035em] text-[#27342c] sm:text-[17px]">{shop.name}</h3>
            </div>
            <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-[#eceae4] text-[#8b948b] transition group-hover:border-[#c75d3e] group-hover:bg-[#fff6f2] group-hover:text-[#b05237]"><ArrowUpRight size={15} aria-hidden="true" /></span>
          </div>
          {shop.genre?.catch && <p className="mt-2 line-clamp-1 text-xs text-[#858d85]">{shop.genre.catch}</p>}
          <div className="mt-4 space-y-2 border-t border-[#f0efea] pt-3 text-xs text-[#737d74]">
            <p className="flex items-start gap-2"><MapPin size={14} className="mt-px shrink-0 text-[#879883]" aria-hidden="true" /><span>{shop.address} · {shop.access}</span></p>
            <p className="flex items-center gap-2"><Wallet size={14} className="shrink-0 text-[#879883]" aria-hidden="true" /><span>{shop.budget?.average ?? shop.budget?.name ?? "予算情報なし"}</span></p>
          </div>
        </div>
      </button>
    </article>
  );
}
