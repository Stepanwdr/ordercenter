import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import styled from 'styled-components';
import { DashboardPage } from '@pages/dashboard/DashboardPage';
import { OrdersPage } from '@pages/orders/OrdersPage';
import { CouriersPage } from '@pages/couriers/CouriersPage';
import { CourierPage } from '@pages/couriers/CourierPage';
import { RestaurantsPage } from '@pages/restaurants/RestaurantsPage';
import { SettingsPage } from '@pages/settings/SettingsPage';
import { LoginPage } from '@pages/auth/LoginPage';
import { RegisterPage } from '@pages/auth/RegisterPage';
import { PrivateRoutes } from './routes/PrivateRoutes';
import { ProfilePage } from '@pages/profile/ProfilePage';
import { PublicRoutes } from './routes/PublicRoutes';
import { initializeSocket } from '@shared/lib/socket';
import { Sidebar } from '@shared/ui/Sidebar';
import 'react-data-grid/lib/styles.css';


const AppShell = styled.div`
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: auto;
  min-width: 0;
  background: radial-gradient(circle at top left, rgba(74, 84, 169, 0.18), transparent 30%), #090b11;
`;

const Content = styled.main`
  padding: 32px;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  box-sizing: border-box;
   padding-left: 120px;
  @media (max-width: 900px) {
    margin-left: 80px;
  }
  @media (max-width: 640px) {
    margin-left: 0;
    padding: 24px 16px;
  }
`;

const PrivateLayout = () => {
  // useEffect(() => {
  //   const cleanup = initializeSocket();
  //   return cleanup;
  // }, []);

  return (
    <AppShell>
      <Sidebar />
      <Content>
        <Outlet />
      </Content>
    </AppShell>
  );
};

export function App() {
  return (
    <Routes>
      <Route element={<PublicRoutes />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<PrivateRoutes />}>
        <Route element={<PrivateLayout />}>
          <Route path="/" element={<OrdersPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/couriers" element={<CouriersPage />} />
          <Route path="/couriers/:id" element={<CourierPage />} />
          <Route path="/restaurants" element={<RestaurantsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
