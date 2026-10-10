const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Pure helpers shared by backend functions (no SDK, no DOM).

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O/1/I)

function rand(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

export function genBookingRef(): string {
  return "MB-" + rand(6);
}

export function genSealId(): string {
  return "HOLO-" + rand(4) + "-" + rand(4);
}

export const ACTIVE_STATUSES = ["pending", "accepted", "sealed", "stored"];

// Computes the total number of bags currently occupying capacity at a business.
// Uses service role so it sees every active booking regardless of RLS.
export async function usedCapacity(base44: any, businessId: string): Promise<number> {
  const usage = await db.asServiceRole.entities.Booking.aggregate({
    query: { business_id: businessId, status: { $in: ACTIVE_STATUSES } },
    groupBy: "business_id",
    sum: "number_of_bags",
  });
  return (usage.rows || [])[0]?.sum_number_of_bags || 0;
}

export function err(msg: string, status: number): Response {
  return Response.json({ error: msg }, { status });
}

export async function getBooking(base44: any, id: string) {
  try {
    return await db.entities.Booking.get(id);
  } catch (e: any) {
    if (e.status === 404) return null;
    throw e;
  }
}

export async function getBusiness(base44: any, id: string) {
  try {
    return await db.entities.Business.get(id);
  } catch (e: any) {
    if (e.status === 404) return null;
    throw e;
  }
}