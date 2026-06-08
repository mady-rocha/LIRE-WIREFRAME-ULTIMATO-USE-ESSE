import { Lock } from "lucide-react";

/** Discreet premium indicator — lock + subtle tag, per brand minimalism. */
export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent ${className ?? ""}`}
    >
      <Lock className="h-3 w-3" />
      Premium
    </span>
  );
}
