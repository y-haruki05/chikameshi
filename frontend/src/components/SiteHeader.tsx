import { ArrowUpRight, MapPin, UtensilsCrossed } from "lucide-react";

interface SiteHeaderProps {
  onNavigate: (href: string) => void;
}

export function SiteHeader({ onNavigate }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#ebe9e2]/90 bg-[#fbfaf7]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <a
          href="/"
          onClick={(event) => { event.preventDefault(); onNavigate("/"); }}
          className="group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c75d3e]"
          aria-label="nearby-eats ホーム"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#c75d3e] text-white shadow-sm transition group-hover:-rotate-3">
            <UtensilsCrossed size={18} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span className="text-[17px] font-bold tracking-[-0.055em] text-[#27342c]">nearby<span className="text-[#c75d3e]">-</span>eats</span>
        </a>

        <nav aria-label="メインナビゲーション" className="flex items-center gap-2 sm:gap-5">
          <a
            href="/#how-it-works"
            onClick={(event) => {
              event.preventDefault();
              onNavigate("/");
              window.setTimeout(() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }), 30);
            }}
            className="hidden rounded-lg px-2 py-2 text-xs font-medium text-[#68736a] hover:text-[#26332b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c75d3e] sm:inline-flex"
          >
            使い方
          </a>
          <span className="hidden items-center gap-1.5 text-xs text-[#7d877e] md:inline-flex"><MapPin size={14} aria-hidden="true" />近くのお店を探そう</span>
          <button
            type="button"
            onClick={() => onNavigate("/")}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#27342c] px-4 text-xs font-semibold text-white transition hover:bg-[#405245] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c6d7c4]"
          >
            お店を探す <ArrowUpRight size={14} aria-hidden="true" />
          </button>
        </nav>
      </div>
    </header>
  );
}
