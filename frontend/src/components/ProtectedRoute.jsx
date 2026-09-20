import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullPageMessage message="Checking your session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={role === 'insurer' ? '/insurer' : '/patient'} replace />;
  }

  return <Outlet />;
}

function FullPageMessage({ message }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-sm text-slate-500">
      {message}
    </main>
  );
}
