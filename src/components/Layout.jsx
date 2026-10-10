import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { LogOut, Store, ListChecks, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const isOwner = user?.account_type === "business_owner";
  const links = isOwner
    ? [
        { to: "/business", label: "Dashboard", icon: LayoutDashboard },
        { to: "/business-bookings", label: "Reservations", icon: ListChecks },
        { to: "/business-settings", label: "Settings", icon: Settings },
      ]
    : [
        { to: "/customer", label: "Browse", icon: Store },
        { to: "/customer-bookings", label: "My Bookings", icon: ListChecks },
      ];

  const linkClass = ({ isActive }) =>
    cn(
      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900",
      isActive && "bg-slate-100 text-slate-900"
    );

  return (
    <div className="min-h-screen bg-[radial-gradient(60rem_60rem_at_120%_-10%,rgba(20,184,166,0.08),transparent),radial-gradient(50rem_50rem_at_-10%_0%,rgba(15,23,42,0.05),transparent)]">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to={isOwner ? "/business" : "/customer"}>
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                <l.icon className="h-4 w-4" />
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-[160px] truncate text-xs font-medium text-slate-500">{user?.email}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-600">{isOwner ? "Storage Partner" : "Shopper"}</p>
            </div>
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900" onClick={() => logout()}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => cn("flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100", isActive && "bg-slate-100 text-slate-900")}>
              <l.icon className="h-4 w-4" />
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}