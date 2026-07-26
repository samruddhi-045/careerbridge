import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// blocks routes if the user isn't logged in (real check happens on the server)
export default function ProtectedRoute({ roles }) {
  const { user, booting } = useAuth();
  const location = useLocation();

  // wait until we know if the user is logged in, so we don't redirect too early
  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}