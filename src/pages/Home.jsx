import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const { user } = useAuth();
  if (!user) return null;
  if (!user.account_type) return <Navigate to="/welcome" replace />;
  if (user.account_type === "business_owner") return <Navigate to="/business" replace />;
  return <Navigate to="/customer" replace />;
}