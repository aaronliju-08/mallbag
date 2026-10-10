import { MapPin, Boxes, ArrowRight, Gift } from "lucide-react";
import { formatPrice, CATEGORY_GRADIENTS } from "@/lib/mallbag-utils";
import { cn } from "@/lib/utils";

export default function BusinessCard({ business, onBook }) {
  const full = (business.available_capacity ?? 0) <= 0;
  const gradient = CATEGORY_GRADIENTS[business.category] || CATEGORY_GRADIENTS.Other;
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={cn("relative h-28 bg-gradient-to-br", gradient)}>
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700">{business.category}</span>
        {business.is_free && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-teal-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            <Gift className="h-3 w-3" /> Free
          </span>
        )}
        <div className="absolute bottom-3 left-3 text-white/90">
          <p className="text-xs font-medium opacity-80">{business.mall_name}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-lg font-semibold text-slate-900">{business.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{business.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-teal-600" /> {business.floor} · {business.shop_number}
          </span>
          <span className="inline-flex items-center gap-1">
            <Boxes className="h-3.5 w-3.5 text-teal-600" /> {business.available_capacity}/{business.capacity} slots
          </span>
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Per bag</p>
            <p className="font-heading text-xl font-bold text-slate-900">{formatPrice(business.price_per_bag)}</p>
          </div>
          <button
            onClick={() => onBook(business)}
            disabled={full}
            className={cn("inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition", full ? "cursor-not-allowed bg-slate-100 text-slate-400" : "bg-slate-900 text-white hover:bg-teal-600")}
          >
            {full ? "Full" : "Book storage"}
            {!full && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}