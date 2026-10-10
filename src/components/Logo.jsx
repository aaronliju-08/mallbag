import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Logo({ className, compact = false }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-sm shadow-teal-500/30">
        <ShoppingBag className="h-5 w-5" strokeWidth={2.2} />
      </div>
      {!compact && (
        <span className="font-heading text-lg font-bold tracking-tight text-slate-900">
          Mall<span className="text-teal-600">Bag</span>
        </span>
      )}
    </div>
  );
}