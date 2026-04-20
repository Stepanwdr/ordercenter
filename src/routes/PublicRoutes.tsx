import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthProvider';

export const PublicRoutes = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
