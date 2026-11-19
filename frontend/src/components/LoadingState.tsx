export function LoadingState() {
  return <div className="grid gap-5 sm:grid-cols-2" role="status" aria-label="お店を読み込み中">
    {Array.from({ length: 4 }, (_, index) => <div key={index} className="overflow-hidden rounded-[1.35rem] border border-[#e9e7df] bg-white"><div className="aspect-[1.58] animate-pulse bg-[#e9ece5]" /><div className="space-y-3 p-5"><div className="h-3 w-1/3 animate-pulse rounded bg-[#e9ece5]" /><div className="h-5 w-2/3 animate-pulse rounded bg-[#e9ece5]" /><div className="h-3 w-full animate-pulse rounded bg-[#f0f1ed]" /></div></div>)}
    <span className="sr-only">お店を読み込んでいます</span>
  </div>;
}
