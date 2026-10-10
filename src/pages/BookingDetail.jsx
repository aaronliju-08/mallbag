const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import SealChip from "@/components/SealChip";
import QRCode from "@/components/QRCode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/AuthContext";
import { formatPrice } from "@/lib/mallbag-utils";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, ShieldCheck, PackageCheck, XCircle, CheckCircle2, History } from "lucide-react";

const EVENT_LABELS = {
  booking_created: "Booking created",
  booking_accepted: "Accepted by partner",
  seals_assigned: "Seals assigned",
  handover_confirmed: "Handover confirmed",
  collection_verified: "Seal verified",
  collection_completed: "Bags released",
  collection_rejected: "Collection rejected",
  booking_cancelled: "Booking cancelled",
};

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [conditions, setConditions] = useState([]);
  const [sealInput, setSealInput] = useState("");

  const isOwner = user?.account_type === "business_owner";

  async function load() {
    setLoading(true);
    try {
      const { data: d } = await db.functions.invoke("mallbagBooking", { action: "detail", id });
      setData(d);
      setConditions(Array.from({ length: d.booking.number_of_bags }, () => ({ condition_at_dropoff: "Good — no visible damage" })));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function run(action, payload, successMsg) {
    setBusy(true);
    try {
      const { data: d } = await db.functions.invoke("mallbagBooking", { action, ...payload });
      toast({ title: successMsg });
      setData(d?.booking ? { ...data, booking: d.booking, bags: d.bags ?? data.bags, events: d.events ?? data.events } : data);
      await load();
    } catch (e) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <p className="text-slate-500">Booking not found.</p>
          <Link to={isOwner ? "/business-bookings" : "/customer-bookings"} className="mt-3 inline-block text-sm font-semibold text-teal-600 hover:underline">Go back</Link>
        </div>
      </Layout>
    );
  }

  const { booking, bags, events } = data;

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-bold text-teal-700">{booking.booking_ref}</p>
                <h1 className="mt-1 font-heading text-2xl font-bold text-slate-900">{booking.business_name}</h1>
              </div>
              <StatusBadge status={booking.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Bags</p>
                <p className="font-semibold text-slate-900">{booking.number_of_bags}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Total</p>
                <p className="font-semibold text-slate-900">{booking.is_free ? "Free" : formatPrice(booking.total_price)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Customer</p>
                <p className="font-semibold text-slate-900">{booking.customer_name}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Created</p>
                <p className="font-semibold text-slate-900">{new Date(booking.created_date).toLocaleDateString()}</p>
              </div>
            </div>
            {booking.notes && <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{booking.notes}</p>}
          </div>

          {/* Seals / bags */}
          {bags.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-600" />
                <h2 className="font-heading text-lg font-semibold text-slate-900">Sealed bags</h2>
              </div>
              <div className="space-y-3">
                {bags.map((bag, i) => (
                  <div key={bag.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-sm font-bold text-white">{i + 1}</span>
                      <SealChip sealId={bag.seal_id} />
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>Drop-off: {bag.condition_at_dropoff}</p>
                      {bag.status === "collected" && <p className="text-emerald-600">Collected {new Date(bag.collected_at).toLocaleString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-heading text-lg font-semibold text-slate-900">Actions</h2>

            {/* Business: accept */}
            {isOwner && booking.status === "pending" && (
              <Button disabled={busy} onClick={() => run("accept", { id }, "Booking accepted")} className="w-full sm:w-auto">
                Accept booking
              </Button>
            )}

            {/* Business: assign seals */}
            {isOwner && booking.status === "accepted" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Record the condition of each bag, then apply a holographic seal.</p>
                {conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-900 text-sm font-bold text-white">{i + 1}</span>
                    <Input
                      value={c.condition_at_dropoff}
                      onChange={(e) => setConditions((prev) => prev.map((x, idx) => (idx === i ? { ...x, condition_at_dropoff: e.target.value } : x)))}
                      placeholder="Bag condition at drop-off"
                      maxLength={200}
                    />
                  </div>
                ))}
                <Button disabled={busy} onClick={() => run("assignSeals", { id, conditions }, "Seals assigned — bags sealed")} className="w-full">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Apply seals & store
                </Button>
              </div>
            )}

            {/* Business: verify & collect */}
            {isOwner && booking.status === "stored" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Verify a bag's seal to release all bags for collection.</p>
                <div className="flex gap-2">
                  <Input value={sealInput} onChange={(e) => setSealInput(e.target.value)} placeholder="Enter seal ID e.g. HOLO-XXXX-XXXX" className="font-mono" />
                  <Button disabled={busy || !sealInput} onClick={() => run("verifyAndCollect", { id, seal_id: sealInput.trim() }, "Bags released to customer")}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />} Collect
                  </Button>
                </div>
              </div>
            )}

            {/* Customer: confirm handover */}
            {!isOwner && booking.status === "sealed" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Your bags are sealed. Confirm the handover so they enter secure storage.</p>
                <Button disabled={busy} onClick={() => run("confirmHandover", { id }, "Handover confirmed — bags in storage")} className="w-full">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Confirm handover
                </Button>
              </div>
            )}

            {/* Customer: cancel */}
            {!isOwner && ["pending", "accepted"].includes(booking.status) && (
              <Button variant="outline" disabled={busy} onClick={() => run("cancel", { id }, "Booking cancelled")} className="w-full text-destructive hover:text-destructive sm:w-auto">
                <XCircle className="h-4 w-4" /> Cancel booking
              </Button>
            )}

            {booking.status === "collected" && (
              <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600"><CheckCircle2 className="h-4 w-4" /> This booking is complete — bags collected.</p>
            )}
            {booking.status === "cancelled" && (
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"><XCircle className="h-4 w-4" /> This booking was cancelled.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Show this at drop-off</p>
            <div className="flex justify-center">
              <QRCode value={booking.booking_ref} size={172} className="rounded-xl border border-slate-100" />
            </div>
            <p className="mt-3 font-mono text-sm font-bold text-slate-900">{booking.booking_ref}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-slate-500" />
              <h2 className="font-heading text-base font-semibold text-slate-900">Timeline</h2>
            </div>
            <ol className="relative space-y-4 border-l border-slate-200 pl-4">
              {events.map((ev) => (
                <li key={ev.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-teal-500 ring-4 ring-white" />
                  <p className="text-sm font-semibold text-slate-900">{EVENT_LABELS[ev.event_type] || ev.event_type}</p>
                  <p className="text-xs text-slate-400">{ev.created_date ? new Date(ev.created_date).toLocaleString() : ""}</p>
                  {ev.notes && <p className="mt-0.5 text-xs text-slate-500">{ev.notes}</p>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Layout>
  );
}