import { CheckCircle2, CircleHelp, LoaderCircle, XCircle } from "lucide-react";
import type { ApiHealth } from "../hooks/useApiHealth";

const labels: Record<ApiHealth, string> = {
  checking: "バックエンドに接続しています",
  online: "バックエンドに接続しました",
  offline: "バックエンドに接続できません",
};

export function ApiStatus({ health }: { health: ApiHealth }) {
  const Icon = health === "online" ? CheckCircle2 : health === "offline" ? XCircle : health === "checking" ? LoaderCircle : CircleHelp;
  const color = health === "online" ? "text-emerald-700" : health === "offline" ? "text-rose-700" : "text-slate-600";

  return (
    <p className={`flex items-center gap-2 text-sm ${color}`} role="status">
      <Icon aria-hidden="true" className={health === "checking" ? "animate-spin" : ""} size={18} />
      {labels[health]}
    </p>
  );
}
