const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2, Minus, Plus, MapPin } from "lucide-react";
import { formatPrice } from "@/lib/mallbag-utils";
import { toast } from "@/components/ui/use-toast";

export default function BookingDialog({ business, onClose }) {
  const navigate = useNavigate();
  const [avail, setAvail] = useState(business.available_capacity ?? 0);
  const [bags, setBags] = useState(1);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    db.functions
      .invoke("mallbagShop", { action: "availability", id: business.id })
      .then(({ data }) => {
        if (data?.available_capacity != null) setAvail(data.available_capacity);
      })
      .catch(() => {});
  }, [business.id]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const max = Math.min(avail || 0, 20);
  const totalPrice = business.is_free ? 0 : (business.price_per_bag || 0) * bags;

  async function submit(e) {
    e.preventDefault();
    if (bags < 1) return;
    if (bags > avail) {
      toast({ title: "Not enough slots available at this partner", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { data } = await db.functions.invoke("mallbagBooking", {
        action: "create",
        business_id: business.id,
        number_of_bags: bags,
        notes: notes || undefined,
      });
      toast({ title: "Booking confirmed", description: `Reference ${data.booking.booking_ref}` });
      navigate(`/booking/${data.booking.id}`);
    } catch (err) {
      toast({ title: "Could not create booking", description: err.message, variant: "destructive" });
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900">Book storage</h2>
            <p className="mt-0.5 text-sm text-slate-500">{business.name}</p>
          </div>
          <button onClick={onClose} disabled={busy} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <MapPin className="h-3.5 w-3.5 text-teal-600" />
          {business.floor} · Shop {business.shop_number} · {formatPrice(business.price_per_bag)} per bag
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <Label className="text-sm font-medium text-slate-700">Number of bags</Label>
            <div className="mt-2 flex items-center gap-3">
              <button type="button" onClick={() => setBags((b) => Math.max(1, b - 1))} disabled={busy || bags <= 1} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                <Minus className="h-4 w-4" />
              </button>
              <div className="flex h-10 w-16 items-center justify-center rounded-xl bg-slate-900 font-heading text-lg font-bold text-white">{bags}</div>
              <button type="button" onClick={() => setBags((b) => Math.min(max || 1, b + 1))} disabled={busy || bags >= max} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                <Plus className="h-4 w-4" />
              </button>
              <span className="ml-1 text-xs text-slate-400">{max} slot(s) available</span>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-slate-700">Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. two soft bags and one backpack" className="mt-2 min-h-[70px] resize-none" maxLength={500} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-teal-50 px-4 py-3">
            <span className="text-sm font-medium text-teal-800">Total</span>
            <span className="font-heading text-xl font-bold text-teal-800">{totalPrice === 0 ? "Free" : `₹${totalPrice}`}</span>
          </div>
          <Button type="submit" className="h-12 w-full text-base" disabled={busy}>
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm booking"}
          </Button>
        </form>
      </div>
    </div>
  );
}