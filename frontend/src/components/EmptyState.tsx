import { Compass, Search } from "lucide-react";
interface EmptyStateProps { onRetry: () => void; onChangeRange: () => void; }
export function EmptyState({ onRetry, onChangeRange }: EmptyStateProps) {
  return <section className="rounded-[1.5rem] border border-dashed border-[#dcded5] bg-white px-6 py-14 text-center" aria-labelledby="empty-heading">
    <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#edf3eb] text-[#57715c]"><Compass size={23} aria-hidden="true" /></span>
    <h2 id="empty-heading" className="mt-5 text-lg font-semibold text-[#27342c]">お店が見つかりませんでした</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#646d65]">検索範囲を広げてお試しください。</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3"><button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#e8e7df] px-5 text-sm font-semibold text-[#58645b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e8b5a5]"><Search size={16} aria-hidden="true" />もう一度検索</button><button type="button" onClick={onChangeRange} className="min-h-11 rounded-xl bg-[#b65336] px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c75d3e]">検索範囲を変更</button></div>
  </section>;
}
