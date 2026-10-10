const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { formatPrice } from "@/lib/mallbag-utils";
import { toast } from "@/components/ui/use-toast";
import { ListChecks, Loader2, Search, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "stored", label: "In storage" },
  { key: "collected", label: "Collected" },
  { key: "cancelled", label: "Cancelled" },
];

export default function BusinessBookings() {
  const [items, setItems] = useState(null);
  const [tab, setTab] = useState("");
  const [refQ, setRefQ] = useState("");
  const [searching, setSearching] = useState(false);

  async function load(status) {
    setItems(null);
    try {
      const { data } = await db.functions.invoke("mallbagBooking", { action: "listBusiness", status: status || undefined });
      setItems(data.items || []);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    load(tab);
  }, [tab]);

  async function findByRef() {
    if (!refQ.trim()) return;
    setSearching(true);
    try {
      const { data } = await db.functions.invoke("mallbagBooking", { action: "findByRef", ref: refQ.trim() });
      window.location.href = `/booking/${data.booking.id}`;
    } catch (e) {
      toast({ title: "Not found", description: e.message, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">Reservations</h1>
        <p className="mt-1 text-sm text-slate-500">Accept, seal, and release bags for your customers.</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={refQ}
            onChange={(e) => setRefQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && findByRef()}
            placeholder="Find by reference e.g. MB-A1B2C3"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 font-mono text-sm text-slate-700 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          />
        </div>
        {searching && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>

      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition", tab === t.key ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}>
            {t.label}
          </button>
        ))}
      </div>

      {items === null ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={ListChecks} title="No reservations yet" description="When a shopper books storage with you, it'll show up here." />
      ) : (
        <div className="grid gap-4">
          {items.map((b) => (
            <Link key={b.id} to={`/booking/${b.id}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <p className="font-mono text-sm font-semibold text-teal-700">{b.booking_ref}</p>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-1 truncate font-heading text-base font-semibold text-slate-900">{b.customer_name}</p>
                <p className="text-xs text-slate-500">{b.number_of_bags} bag{b.number_of_bags > 1 ? "s" : ""} · {b.is_free ? "Free" : formatPrice(b.total_price)}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-slate-400" />
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}