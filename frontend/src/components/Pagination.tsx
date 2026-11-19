import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps { page: number; pageCount: number; onChange: (page: number) => void; }

export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  return <nav aria-label="検索結果のページ" className="flex items-center justify-center gap-2 py-8">
    <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="前のページ" className="flex size-10 items-center justify-center rounded-xl border border-[#e8e7df] bg-white text-[#55635a] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c75d3e]"><ChevronLeft size={17} aria-hidden="true" /></button>
    {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button key={number} type="button" onClick={() => onChange(number)} aria-current={number === page ? "page" : undefined} aria-label={number + "ページ目"} className={number === page ? "size-10 rounded-xl bg-[#27342c] text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c75d3e]" : "size-10 rounded-xl border border-[#e8e7df] bg-white text-xs font-semibold text-[#68736a] hover:bg-[#f5f6f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c75d3e]"}>{number}</button>)}
    <button type="button" onClick={() => onChange(page + 1)} disabled={page >= pageCount} aria-label="次のページ" className="flex size-10 items-center justify-center rounded-xl border border-[#e8e7df] bg-white text-[#55635a] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c75d3e]"><ChevronRight size={17} aria-hidden="true" /></button>
  </nav>;
}
