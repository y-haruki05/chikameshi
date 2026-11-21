import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import type { DemoShop } from "../types/demoShop";

interface ShopImageProps {
  shop: DemoShop;
  className?: string;
  sizes?: string;
}

export function ShopImage({ shop, className = "", sizes }: ShopImageProps) {
  const imageUrls = [shop.photo?.pc?.l, shop.photo?.pc?.m, shop.photo?.pc?.s]
    .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    .filter((url, index, urls) => urls.indexOf(url) === index);
  const imageKey = imageUrls.join("|");
  const [failedImage, setFailedImage] = useState<{ key: string; index: number } | null>(null);
  const imageIndex = failedImage?.key === imageKey ? failedImage.index : 0;
  const imageUrl = imageUrls[imageIndex];

  if (!imageUrl) {
    return (
      <div className={`relative isolate flex items-center justify-center overflow-hidden bg-[#f1eee5] ${className}`} role="img" aria-label={`${shop.name}の写真は現在表示できません`}>
        <div className="absolute -right-8 -top-10 -z-10 size-40 rounded-full bg-[#ead8c8]" />
        <div className="absolute -bottom-14 -left-8 -z-10 size-44 rounded-full bg-[#dce5d8]" />
        <div className="flex flex-col items-center gap-3 px-4 text-center text-[#667866]">
          <span className="flex size-14 items-center justify-center rounded-2xl border border-white/80 bg-white/75 text-[#bb6849] shadow-sm"><UtensilsCrossed size={23} strokeWidth={1.7} aria-hidden="true" /></span>
          <span className="max-w-full truncate text-xs font-semibold">{shop.name}</span>
          <span className="text-[10px] text-[#7d877e]">店舗写真を表示できません</span>
        </div>
      </div>
    );
  }

  return <img src={imageUrl} alt={`${shop.name}の写真`} sizes={sizes} loading="lazy" onError={() => setFailedImage({ key: imageKey, index: imageIndex + 1 })} className={`object-cover ${className}`} />;
}
