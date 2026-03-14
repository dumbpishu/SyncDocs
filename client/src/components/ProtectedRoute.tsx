import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: any) {

  const { user, loading } = useAuth();

  console.log("ProtectedRoute - user:", user, "loading:", loading);

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/" />;

  return children;
}
