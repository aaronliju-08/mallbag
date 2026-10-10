import { STATUS_LABELS, STATUS_TONES } from "@/lib/mallbag-utils";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
};

export default function StatusBadge({ status, className }) {
  const tone = STATUS_TONES[status] || "slate";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", TONE_CLASSES[tone], className)}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}