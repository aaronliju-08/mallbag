import { cn } from "@/lib/utils";

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-14 text-center", className)}>
      {Icon && <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-600"><Icon className="h-6 w-6" /></div>}
      <h3 className="font-heading text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}