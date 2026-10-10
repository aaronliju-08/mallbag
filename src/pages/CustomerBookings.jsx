const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { formatPrice } from "@/lib/mallbag-utils";
import { ListChecks, Loader2, ArrowRight } from "lucide-react";

export default function CustomerBookings() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.functions
      .invoke("mallbagBooking", { action: "listCustomer" })
      .then(({ data }) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">My bookings</h1>
        <p className="mt-1 text-sm text-slate-500">Track every bag from drop-off to collection.</p>
      </div>

      {items === null ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={ListChecks} title="No bookings yet" description="Browse partners and book your first storage slot." action={<Link to="/customer" className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600">Browse partners <ArrowRight className="h-4 w-4" /></Link>} />
      ) : (
        <div className="grid gap-4">
          {items.map((b) => (
            <Link key={b.id} to={`/booking/${b.id}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <p className="font-mono text-sm font-semibold text-teal-700">{b.booking_ref}</p>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-1 truncate font-heading text-base font-semibold text-slate-900">{b.business_name}</p>
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