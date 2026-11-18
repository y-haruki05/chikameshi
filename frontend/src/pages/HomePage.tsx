import { MapPin, Utensils } from "lucide-react";
import type { ApiHealth } from "../hooks/useApiHealth";
import { ApiStatus } from "../components/ApiStatus";

export function HomePage({ health }: { health: ApiHealth }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
          <Utensils aria-hidden="true" size={27} />
        </div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-emerald-800">nearby-eats</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">近くのおいしいを、見つけよう。</h1>
        <p className="mt-4 max-w-xl leading-7 text-slate-600">
          近くの飲食店を探すWebアプリです。現在は開発環境とAPI連携の準備をしています。
        </p>
        <div className="mt-8 rounded-2xl bg-slate-50 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
            <MapPin aria-hidden="true" size={18} /> 接続確認
          </h2>
          <ApiStatus health={health} />
        </div>
        <p className="mt-6 text-xs leading-5 text-slate-500">
          店舗検索を使うには、プロジェクトルートの .env に新しい HotPepper API キーを設定してください。
        </p>
      </section>
    </main>
  );
}
