import { AlertCircle, RotateCcw } from "lucide-react";
interface ErrorMessageProps { onRetry: () => void; }
export function ErrorMessage({ onRetry }: ErrorMessageProps) {
  return <section className="rounded-[1.5rem] border border-[#efded7] bg-[#fffaf8] px-6 py-14 text-center" role="alert">
    <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#f9e9e3] text-[#b4563a]"><AlertCircle size={23} aria-hidden="true" /></span><h2 className="mt-5 text-lg font-semibold text-[#27342c]">お店を読み込めませんでした</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#7c857d]">通信に失敗しました。少し時間をおいて、もう一度お試しください。</p>
    <button type="button" onClick={onRetry} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#27342c] px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c6d7c4]"><RotateCcw size={15} aria-hidden="true" />再読み込み</button>
  </section>;
}
