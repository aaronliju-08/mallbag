const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { ACTIVE_STATUSES, usedCapacity, genBookingRef, genSealId, err, getBooking, getBusiness } from "../../shared/mallbag.ts";

// Booking lifecycle + reads. Dispatched via `action` in the payload.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return err("Unauthorized", 401);

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // ---- Customer creates a booking (capacity-checked) ----
    if (action === "create") {
      const { business_id, number_of_bags, notes } = body;
      if (!business_id) return err("Missing business_id", 400);
      const n = Math.floor(Number(number_of_bags));
      if (!n || n < 1 || n > 20) return err("Invalid bag count", 400);
      const biz = await getBusiness(base44, business_id);
      if (!biz) return err("Business not found", 404);
      if (biz.active === false) return err("This business is not accepting storage right now", 400);
      const used = await usedCapacity(base44, biz.id);
      const available = (biz.capacity || 0) - used;
      if (n > available) return err(`Only ${available} bag slot(s) available at this partner`, 400);
      const total_price = biz.is_free ? 0 : (biz.price_per_bag || 0) * n;
      const booking_ref = genBookingRef();
      const booking = await db.entities.Booking.create({
        booking_ref,
        business_id: biz.id,
        business_name: biz.name,
        business_owner_id: biz.created_by_id,
        customer_name: user.full_name || user.email,
        number_of_bags: n,
        total_price,
        is_free: !!biz.is_free,
        status: "pending",
        notes: notes || "",
      });
      await db.entities.HandoverEvent.create({
        booking_id: booking.id,
        booking_ref,
        customer_id: user.id,
        business_owner_id: biz.created_by_id,
        business_id: biz.id,
        event_type: "booking_created",
        actor_role: "customer",
        notes: `Booking created for ${n} bag(s) at ${biz.name}.`,
      });
      return Response.json({ booking });
    }

    // ---- Business accepts ----
    if (action === "accept") {
      if (!body.id) return err("Missing id", 400);
      const booking = await getBooking(base44, body.id);
      if (!booking) return err("Booking not found", 404);
      if (booking.business_owner_id !== user.id) return err("Not your booking", 403);
      if (booking.status !== "pending") return err("Only pending bookings can be accepted", 400);
      const updated = await db.entities.Booking.update(body.id, { status: "accepted", accepted_at: new Date().toISOString() });
      await db.entities.HandoverEvent.create({
        booking_id: booking.id, booking_ref: booking.booking_ref, customer_id: booking.created_by_id,
        business_owner_id: user.id, business_id: booking.business_id,
        event_type: "booking_accepted", actor_role: "business_owner", notes: "Booking accepted by partner.",
      });
      return Response.json({ booking: updated });
    }

    // ---- Business assigns holographic seals (drop-off) ----
    if (action === "assignSeals") {
      if (!body.id) return err("Missing id", 400);
      const conditions = body.conditions;
      if (!Array.isArray(conditions) || conditions.length < 1) return err("Record a condition for every bag", 400);
      const booking = await getBooking(base44, body.id);
      if (!booking) return err("Booking not found", 404);
      if (booking.business_owner_id !== user.id) return err("Not your booking", 403);
      if (booking.status !== "accepted") return err("Booking must be accepted first", 400);
      if (conditions.length !== booking.number_of_bags) return err("Record a condition for every bag", 400);
      const now = new Date().toISOString();
      const seals: string[] = [];
      for (let i = 0; i < booking.number_of_bags; i++) {
        const seal_id = genSealId();
        seals.push(seal_id);
        await db.entities.Bag.create({
          booking_id: booking.id, booking_ref: booking.booking_ref, customer_id: booking.created_by_id,
          business_owner_id: user.id, business_id: booking.business_id, seal_id,
          condition_at_dropoff: conditions[i]?.condition_at_dropoff || "Good — no visible damage",
          status: "sealed", sealed_at: now,
        });
      }
      const updated = await db.entities.Booking.update(body.id, { status: "sealed", stored_at: now });
      await db.entities.HandoverEvent.create({
        booking_id: booking.id, booking_ref: booking.booking_ref, customer_id: booking.created_by_id,
        business_owner_id: user.id, business_id: booking.business_id,
        event_type: "seals_assigned", actor_role: "business_owner", notes: `Holographic seals applied: ${seals.join(", ")}`,
      });
      return Response.json({ booking: updated });
    }

    // ---- Customer confirms the handover (→ in storage) ----
    if (action === "confirmHandover") {
      if (!body.id) return err("Missing id", 400);
      const booking = await getBooking(base44, body.id);
      if (!booking) return err("Booking not found", 404);
      if (booking.created_by_id !== user.id) return err("Not your booking", 403);
      if (booking.status !== "sealed") return err("Partner must seal the bags first", 400);
      // mark bags as stored
      const bagsPage = await db.entities.Bag.filter({ booking_id: booking.id }, { limit: 100 });
      await db.entities.Bag.bulkUpdate((bagsPage.items || []).map((b: any) => ({ id: b.id, status: "stored" })));
      const updated = await db.entities.Booking.update(body.id, { status: "stored" });
      await db.entities.HandoverEvent.create({
        booking_id: booking.id, booking_ref: booking.booking_ref, customer_id: user.id,
        business_owner_id: booking.business_owner_id, business_id: booking.business_id,
        event_type: "handover_confirmed", actor_role: "customer", notes: "Customer confirmed handover. Bags are now in storage.",
      });
      return Response.json({ booking: updated });
    }

    // ---- Business verifies the seal and releases bags (collection) ----
    if (action === "verifyAndCollect") {
      if (!body.id || !body.seal_id) return err("Missing id or seal_id", 400);
      const booking = await getBooking(base44, body.id);
      if (!booking) return err("Booking not found", 404);
      if (booking.business_owner_id !== user.id) return err("Not your booking", 403);
      const recordRejection = (notes: string) => db.entities.HandoverEvent.create({
        booking_id: booking.id, booking_ref: booking.booking_ref, customer_id: booking.created_by_id,
        business_owner_id: user.id, business_id: booking.business_id,
        event_type: "collection_rejected", actor_role: "business_owner", notes, seal_id: body.seal_id,
      });
      if (booking.status === "collected") {
        await recordRejection("Rejected: booking already collected.");
        return err("This booking has already been collected", 400);
      }
      if (booking.status !== "stored") return err("Bags must be in storage before collection", 400);
      const bagsPage = await db.entities.Bag.filter({ booking_id: booking.id }, { limit: 100 });
      const bags = bagsPage.items || [];
      const matched = bags.find((b: any) => b.seal_id === body.seal_id);
      if (!matched) {
        await recordRejection("Rejected: seal ID did not match any bag for this booking.");
        return err("Seal ID does not match any bag for this booking", 400);
      }
      const now = new Date().toISOString();
      await db.entities.Bag.bulkUpdate(bags.map((b: any) => ({ id: b.id, status: "collected", collected_at: now })));
      const updated = await db.entities.Booking.update(body.id, { status: "collected", collected_at: now });
      await db.entities.HandoverEvent.create({
        booking_id: booking.id, booking_ref: booking.booking_ref, customer_id: booking.created_by_id,
        business_owner_id: user.id, business_id: booking.business_id,
        event_type: "collection_verified", actor_role: "business_owner", notes: `Seal ${body.seal_id} verified against the booking.`, seal_id: body.seal_id,
      });
      await db.entities.HandoverEvent.create({
        booking_id: booking.id, booking_ref: booking.booking_ref, customer_id: booking.created_by_id,
        business_owner_id: user.id, business_id: booking.business_id,
        event_type: "collection_completed", actor_role: "business_owner", notes: "All bags released to the customer.",
      });
      return Response.json({ booking: updated });
    }

    // ---- Customer cancels (only before sealing) ----
    if (action === "cancel") {
      if (!body.id) return err("Missing id", 400);
      const booking = await getBooking(base44, body.id);
      if (!booking) return err("Booking not found", 404);
      if (booking.created_by_id !== user.id) return err("Not your booking", 403);
      if (!["pending", "accepted"].includes(booking.status)) return err("Cannot cancel a booking already in storage", 400);
      const updated = await db.entities.Booking.update(body.id, { status: "cancelled" });
      await db.entities.HandoverEvent.create({
        booking_id: booking.id, booking_ref: booking.booking_ref, customer_id: user.id,
        business_owner_id: booking.business_owner_id, business_id: booking.business_id,
        event_type: "booking_cancelled", actor_role: "customer", notes: "Booking cancelled by customer.",
      });
      return Response.json({ booking: updated });
    }

    // ---- Reads ----
    if (action === "detail") {
      if (!body.id) return err("Missing id", 400);
      const booking = await getBooking(base44, body.id);
      if (!booking) return err("Booking not found", 404);
      const [bagsPage, eventsPage] = await Promise.all([
        db.entities.Bag.filter({ booking_id: booking.id }, { sort: "sealed_at", limit: 50 }),
        db.entities.HandoverEvent.filter({ booking_id: booking.id }, { sort: "-created_date", limit: 50 }),
      ]);
      return Response.json({ booking, bags: bagsPage.items || [], events: eventsPage.items || [] });
    }

    if (action === "findByRef") {
      if (!body.ref) return err("Missing ref", 400);
      const page = await db.entities.Booking.filter({ booking_ref: body.ref, business_owner_id: user.id }, { limit: 1 });
      const booking = (page.items || [])[0];
      if (!booking) return err("No booking found with that reference for your business", 404);
      return Response.json({ booking });
    }

    if (action === "listCustomer") {
      const page = await db.entities.Booking.filter({ created_by_id: user.id }, { sort: "-created_date", limit: 100 });
      return Response.json({ items: page.items || [] });
    }

    if (action === "listBusiness") {
      if (!user.business_id) return Response.json({ items: [] });
      const query: any = { business_id: user.business_id };
      if (body.status) query.status = body.status;
      const page = await db.entities.Booking.filter(query, { sort: "-created_date", limit: 100 });
      return Response.json({ items: page.items || [] });
    }

    return err("Unknown action", 400);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}