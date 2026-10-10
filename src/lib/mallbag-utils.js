// Pure client-side helpers (no SDK, no DOM).

export function formatPrice(n) {
  if (n == null || n === 0) return "Free";
  return "₹" + Number(n).toFixed(0);
}

export const ACTIVE_STATUSES = ["pending", "accepted", "sealed", "stored"];

export const STATUS_LABELS = {
  pending: "Pending acceptance",
  accepted: "Accepted — awaiting drop-off",
  sealed: "Bags sealed by partner",
  stored: "In storage",
  collected: "Collected",
  cancelled: "Cancelled",
};

export const STATUS_TONES = {
  pending: "amber",
  accepted: "blue",
  sealed: "violet",
  stored: "teal",
  collected: "emerald",
  cancelled: "slate",
};

export const CATEGORY_GRADIENTS = {
  Electronics: "from-blue-600 to-indigo-700",
  Fashion: "from-pink-600 to-rose-700",
  Books: "from-amber-600 to-orange-700",
  Food: "from-orange-500 to-red-600",
  Cinema: "from-violet-600 to-purple-700",
  Entertainment: "from-fuchsia-600 to-pink-700",
  Sports: "from-emerald-600 to-teal-700",
  Concierge: "from-slate-800 to-slate-900",
  Other: "from-teal-600 to-cyan-700",
};

export const FLOORS = ["Ground", "First", "Second", "Third"];
export const CATEGORIES = ["Electronics", "Fashion", "Books", "Food", "Cinema", "Entertainment", "Sports", "Concierge", "Other"];