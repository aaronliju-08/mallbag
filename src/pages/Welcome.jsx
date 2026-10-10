const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

import Logo from "@/components/Logo";
import { ShoppingBag, Store, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function Welcome() {
  const { checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function choose(account_type) {
    setBusy(true);
    try {
      await db.auth.updateMe({ account_type });
      await checkUserAuth();
      navigate(account_type === "business_owner" ? "/business" : "/customer", { replace: true });
    } catch (e) {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(60rem_60rem_at_120%_-10%,rgba(20,184,166,0.1),transparent),radial-gradient(50rem_50rem_at_-10%_0%,rgba(15,23,42,0.05),transparent)] px-4">
      <Logo className="mb-8" />
      <div className="w-full max-w-md text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">Shop freely. Carry nothing.</h1>
        <p className="mt-2 text-sm text-slate-500">Tell us how you'll use MallBag so we can set up your space.</p>
      </div>
      <div className="mt-8 grid w-full max-w-md gap-4">
        <button
          onClick={() => choose("customer")}
          disabled={busy}
          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md disabled:opacity-60"
        >
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-600">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-heading text-lg font-semibold text-slate-900">I'm a Shopper</p>
            <p className="text-sm text-slate-500">Browse partners and store your bags.</p>
          </div>
          {busy ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5" />}
        </button>
        <button
          onClick={() => choose("business_owner")}
          disabled={busy}
          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md disabled:opacity-60"
        >
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-600">
            <Store className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-heading text-lg font-semibold text-slate-900">I run a store</p>
            <p className="text-sm text-slate-500">Offer bag storage to mall shoppers.</p>
          </div>
          {busy ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5" />}
        </button>
      </div>
    </div>
  );
}