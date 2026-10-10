const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { ACTIVE_STATUSES, usedCapacity, err, getBusiness } from "../../shared/mallbag.ts";

// Browse + business management + stats. Dispatched via `action` in the payload.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return err("Unauthorized", 401);

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // ---- Public-ish browse (still requires a logged-in shopper) ----
    if (action === "list") {
      const query = { active: true };
      if (body.filter === "free") query.is_free = true;
      if (body.filter === "paid") query.is_free = false;
      if (body.search) query.name = { $regex: body.search, $options: "i" };
      const page = await db.entities.Business.filter(query, {
        sort: "name",
        limit: 100,
        fields: ["name", "description", "shop_number", "floor", "category", "price_per_bag", "is_free", "capacity", "image_url", "mall_name"],
      });
      const usage = await db.asServiceRole.entities.Booking.aggregate({
        query: { status: { $in: ACTIVE_STATUSES } },
        groupBy: "business_id",
        sum: "number_of_bags",
      });
      const usedMap: Record<string, number> = {};
      for (const r of usage.rows || []) usedMap[r.business_id] = r.sum_number_of_bags || 0;
      const items = (page.items || []).map((biz: any) => ({
        ...biz,
        used_capacity: usedMap[biz.id] || 0,
        available_capacity: Math.max(0, (biz.capacity || 0) - (usedMap[biz.id] || 0)),
      }));
      return Response.json({ items });
    }

    if (action === "availability") {
      if (!body.id) return err("Missing id", 400);
      const biz = await getBusiness(base44, body.id);
      if (!biz) return err("Business not found", 404);
      const used = await usedCapacity(base44, biz.id);
      return Response.json({ ...biz, used_capacity: used, available_capacity: Math.max(0, (biz.capacity || 0) - used) });
    }

    // ---- Partner: own business ----
    if (action === "myBusiness") {
      if (!user.business_id) return Response.json({ business: null });
      const biz = await getBusiness(base44, user.business_id).catch(() => null);
      return Response.json({ business: biz });
    }

    if (action === "createBusiness") {
      const { name, description, shop_number, floor, category, price_per_bag, is_free, capacity, image_url } = body;
      if (!name || !shop_number || !floor || capacity == null) return err("Missing required fields", 400);
      if (user.business_id) return err("You already manage a business", 400);
      const biz = await db.entities.Business.create({
        name,
        description: description || "",
        shop_number,
        floor,
        category: category || "Other",
        price_per_bag: Number(price_per_bag) || 0,
        is_free: !!is_free,
        capacity: Number(capacity),
        image_url: image_url || "",
        mall_name: "Aurora Mall",
        active: true,
      });
      return Response.json({ business: biz });
    }

    if (action === "updateBusiness") {
      const { id, ...patch } = body;
      if (!id) return err("Missing id", 400);
      const biz = await getBusiness(base44, id);
      if (!biz) return err("Business not found", 404);
      if (biz.created_by_id !== user.id && user.role !== "admin") return err("Not your business", 403);
      const allowed = ["name", "description", "shop_number", "floor", "category", "price_per_bag", "is_free", "capacity", "image_url", "active"];
      const clean: any = {};
      for (const k of allowed) if (k in patch) clean[k] = patch[k];
      if ("price_per_bag" in clean) clean.price_per_bag = Number(clean.price_per_bag) || 0;
      if ("capacity" in clean) clean.capacity = Number(clean.capacity) || 0;
      const updated = await db.entities.Business.update(id, clean);
      return Response.json({ business: updated });
    }

    if (action === "stats") {
      if (!user.business_id) return Response.json({ stats: null });
      const agg = await db.entities.Booking.aggregate({
        query: { business_id: user.business_id },
        groupBy: "status",
        sum: "number_of_bags",
      });
      const stats: any = { pending: 0, accepted: 0, sealed: 0, stored: 0, collected: 0, cancelled: 0, stored_bags: 0, completed_bags: 0 };
      for (const r of agg.rows || []) {
        stats[r.status] = r.count || 0;
        if (r.status === "sealed" || r.status === "stored") stats.stored_bags += r.sum_number_of_bags || 0;
        if (r.status === "collected") stats.completed_bags += r.sum_number_of_bags || 0;
      }
      const biz = await getBusiness(base44, user.business_id).catch(() => null);
      const used = await usedCapacity(base44, user.business_id);
      return Response.json({ stats, capacity: biz?.capacity || 0, used_capacity: used });
    }

    return err("Unknown action", 400);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}