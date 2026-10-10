const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from "react";

import { useAuth } from "@/lib/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FLOORS, CATEGORIES } from "@/lib/mallbag-utils";
import { toast } from "@/components/ui/use-toast";
import { Store, Loader2, Boxes, PackageCheck, Inbox, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";

export default function BusinessDashboard() {
  const { user, checkUserAuth } = useAuth();
  const [biz, setBiz] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // onboarding form
  const [form, setForm] = useState({ name: "", description: "", shop_number: "", floor: "Ground", category: "Fashion", price_per_bag: 50, is_free: false, capacity: 10 });
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await db.functions.invoke("mallbagShop", { action: "myBusiness" });
      setBiz(data.business);
      if (data.business) {
        const { data: s } = await db.functions.invoke("mallbagShop", { action: "stats" });
        setStats(s);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createBusiness(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await db.functions.invoke("mallbagShop", { action: "createBusiness", ...form });
      await db.auth.updateMe({ business_id: data.business.id });
      await checkUserAuth();
      toast({ title: "Business created", description: "Your storage listing is live." });
      await load();
    } catch (e) {
      toast({ title: "Could not create business", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
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

  // Onboarding
  if (!biz) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">List your store</h1>
            <p className="mt-1 text-sm text-slate-500">Offer bag storage to Aurora Mall shoppers. You can edit these details anytime.</p>
          </div>
          <form onSubmit={createBusiness} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business name">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="The Book Nook" />
              </Field>
              <Field label="Shop number">
                <Input value={form.shop_number} onChange={(e) => setForm({ ...form, shop_number: e.target.value })} required placeholder="G-12" />
              </Field>
              <Field label="Floor">
                <select value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {FLOORS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Capacity (bags)">
                <Input type="number" min={0} max={500} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} required />
              </Field>
              <Field label="Price per bag (₹)">
                <Input type="number" min={0} max={5000} value={form.price_per_bag} onChange={(e) => setForm({ ...form, price_per_bag: Number(e.target.value) })} disabled={form.is_free} />
              </Field>
            </div>
            <Field label="Short description">
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell shoppers what you store and any limits." maxLength={300} className="min-h-[70px] resize-none" />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-teal-600" />
              Offer free storage
            </label>
            <Button type="submit" disabled={creating} className="w-full">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />} Publish listing
            </Button>
          </form>
        </div>
      </Layout>
    );
  }

  // Dashboard
  const cap = stats?.capacity || biz.capacity || 0;
  const used = stats?.used_capacity || 0;
  const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;

  const cards = [
    { label: "Pending", value: stats?.pending || 0, icon: Inbox, tone: "text-amber-600 bg-amber-50" },
    { label: "In storage", value: stats?.stored_bags || 0, icon: Boxes, tone: "text-teal-600 bg-teal-50" },
    { label: "Collected", value: stats?.completed_bags || 0, icon: PackageCheck, tone: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <Layout>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">{biz.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{biz.floor} · Shop {biz.shop_number} · {biz.category}</p>
        </div>
        <Link to="/business-bookings" className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600">
          <ListChecks className="h-4 w-4" /> Reservations
        </Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${c.tone}`}><c.icon className="h-5 w-5" /></div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{c.label}</p>
            <p className="font-heading text-2xl font-bold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-heading text-base font-semibold text-slate-900">Capacity</p>
          <p className="text-sm text-slate-500">{used} / {cap} bags</p>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-400">{cap - used} slot(s) available right now.</p>
      </div>
    </Layout>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      {children}
    </div>
  );
}