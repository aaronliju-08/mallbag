const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState } from "react";

import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FLOORS, CATEGORIES } from "@/lib/mallbag-utils";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save, Store } from "lucide-react";

export default function BusinessSettings() {
  const [biz, setBiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    db.functions
      .invoke("mallbagShop", { action: "myBusiness" })
      .then(({ data }) => {
        setBiz(data.business);
        if (data.business) {
          setForm({
            name: data.business.name || "",
            description: data.business.description || "",
            shop_number: data.business.shop_number || "",
            floor: data.business.floor || "Ground",
            category: data.business.category || "Other",
            price_per_bag: data.business.price_per_bag || 0,
            is_free: !!data.business.is_free,
            capacity: data.business.capacity || 0,
            active: data.business.active !== false,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await db.functions.invoke("mallbagShop", { action: "updateBusiness", id: biz.id, ...form });
      setBiz(data.business);
      toast({ title: "Saved", description: "Your listing is updated." });
    } catch (e) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
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

  if (!biz) {
    return (
      <Layout>
        <EmptyStateInline />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your storage listing and availability.</p>
      </div>

      <form onSubmit={save} className="max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Shop number">
            <Input value={form.shop_number} onChange={(e) => setForm({ ...form, shop_number: e.target.value })} required />
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
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={300} className="min-h-[70px] resize-none" />
        </Field>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-teal-600" />
            Offer free storage
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-teal-600" />
            Accepting bookings
          </label>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
        </Button>
      </form>
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

function EmptyStateInline() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-14 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-600"><Store className="h-6 w-6" /></div>
      <h3 className="font-heading text-base font-semibold text-slate-900">No business yet</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">Create your listing from the dashboard first.</p>
    </div>
  );
}