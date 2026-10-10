import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SealChip({ sealId, className, size = "sm" }) {
  if (!sealId) return null;
  const padding = size === "lg" ? "px-4 py-2 text-base" : "px-3 py-1.5 text-sm";
  return (
    <span
      className={cn("inline-flex items-center gap-2 rounded-lg border border-teal-200 font-mono font-semibold text-teal-800 seal-shimmer", padding, className)}
      style={{ backgroundImage: "linear-gradient(110deg, #f0fdfa 0%, #ecfeff 25%, #f0fdfa 50%, #ecfeff 75%, #f0fdfa 100%)" }}
    >
      <ShieldCheck className="h-4 w-4 shrink-0 text-teal-600" />
      {sealId}
    </span>
  );
}