import { useMemo, useState } from 'react';
import { NavLink, Outlet, useOutletContext } from 'react-router-dom';
import styled from 'styled-components';
import { Dropdown } from '@shared/ui/Dropdown';
import { DateRangePicker, type DateRange } from '@shared/ui/DateRangePicker';
import { useAuth } from '@app/providers/AuthProvider';
import { useManagerRestaurantsQuery, downloadOrdersCsv, type ManagerRestaurant } from '@app/hooks/managerApi';

const API_IMG_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5000';
const resolveImg = (u?: string | null) =>
  !u ? '' : u.startsWith('http') || u.startsWith('//') ? u : `${API_IMG_BASE}${u}`;

// Shared state the manager pages read (restaurant + date filter).
export interface ManagerCtx {
  restaurantId: string;
  dateFrom?: string;
  dateTo?: string;
  restaurants: ManagerRestaurant[];
}
export const useManagerCtx = () => useOutletContext<ManagerCtx>();

const NAV = [
  { to: '/', end: true, icon: '📊', label: 'Продажи' },
  { to: '/orders', icon: '🧾', label: 'Заказы' },
  { to: '/menu', icon: '🍽️', label: 'Меню' },
];

export default function ManagerLayout() {
  const { user, logout } = useAuth();
  const [restaurantId, setRestaurantId] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });

  const dateFrom = dateRange.start ? dateRange.start.toISOString() : undefined;
  const dateTo = dateRange.end ? dateRange.end.toISOString() : undefined;

  const { data: restaurants = [] } = useManagerRestaurantsQuery();
  const restaurantOptions = useMemo(
    () => [{ value: '', label: 'Все рестораны' }, ...restaurants.map((r) => ({ value: r.id, label: r.name }))],
    [restaurants],
  );
  const activeLogo = restaurants.find((r) => r.id === restaurantId)?.logo || restaurants[0]?.logo;

  const ctx: ManagerCtx = { restaurantId, dateFrom, dateTo, restaurants };
  const params = { restaurantId: restaurantId || undefined, dateFrom, dateTo };

  return (
    <Shell>
      <Aside>
        <Brand>
          {activeLogo ? <Logo src={resolveImg(activeLogo)} alt="" /> : <LogoFallback>🍽️</LogoFallback>}
          <div>
            <BrandName>{restaurants.find((r) => r.id === restaurantId)?.name || 'Кабинет'}</BrandName>
            <BrandSub>{user?.name || user?.email}</BrandSub>
          </div>
        </Brand>
        <Nav>
          {NAV.map((n) => (
            <NavItem key={n.to} to={n.to} end={n.end}>
              <span>{n.icon}</span> {n.label}
            </NavItem>
          ))}
        </Nav>
        <LogoutBtn onClick={logout}>⎋ Выйти</LogoutBtn>
      </Aside>

      <Main>
        <Header>
          <HTitle>Кабинет руководителя</HTitle>
          <Controls>
            <Dropdown value={restaurantId} options={restaurantOptions} placeholder="Ресторан" onChange={setRestaurantId} />
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              locale="ru-RU"
              align="right"
              labels={{ placeholder: 'Период', clear: 'Сбросить', apply: 'Применить' }}
            />
            <CsvBtn onClick={() => downloadOrdersCsv(params)}>⬇ CSV</CsvBtn>
          </Controls>
        </Header>
        <Content>
          <Outlet context={ctx} />
        </Content>
      </Main>
    </Shell>
  );
}

/* ---------- styles ---------- */
const Shell = styled.div`
  display: grid;
  grid-template-columns: 232px 1fr;
  min-height: 100vh;
  background: radial-gradient(circle at top left, rgba(74, 84, 169, 0.18), transparent 30%), #090b11;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  @media (max-width: 720px) { grid-template-columns: 1fr; }
`;
const Aside = styled.aside`
  background: #0d111a;
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: sticky;
  top: 0;
  height: 100vh;
  @media (max-width: 720px) { position: static; height: auto; }
`;
const Brand = styled.div` display: flex; align-items: center; gap: 10px; min-width: 0; padding: 4px; `;
const Logo = styled.img` width: 42px; height: 42px; border-radius: 11px; object-fit: cover; border: 1px solid rgba(255,255,255,0.12); flex-shrink: 0; `;
const LogoFallback = styled.div`
  width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center;
  font-size: 20px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); flex-shrink: 0;
`;
const BrandName = styled.div` font-weight: 700; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; `;
const BrandSub = styled.div` font-size: 12px; opacity: 0.55; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; `;
const Nav = styled.nav` display: grid; gap: 4px; margin-top: 6px; flex: 1; `;
const NavItem = styled(NavLink)`
  display: flex; align-items: center; gap: 10px;
  padding: 11px 12px; border-radius: 11px; text-decoration: none; color: rgba(255,255,255,0.72);
  font-weight: 600; font-size: 14px;
  span { font-size: 16px; }
  &:hover { background: rgba(255,255,255,0.05); color: #fff; }
  &.active { background: rgba(79,143,255,0.16); color: #fff; border: 1px solid rgba(79,143,255,0.35); }
`;
const LogoutBtn = styled.button`
  border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.8);
  border-radius: 11px; padding: 11px; cursor: pointer; font-weight: 600; text-align: left;
  &:hover { background: rgba(239,68,68,0.14); color: #ef4444; }
`;
const Main = styled.main` min-width: 0; display: flex; flex-direction: column; `;
const Header = styled.header`
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.07);
  position: sticky; top: 0; background: rgba(9,11,17,0.85); backdrop-filter: blur(8px); z-index: 20;
`;
const HTitle = styled.h1` margin: 0; font-size: 18px; `;
const Controls = styled.div` display: flex; align-items: center; gap: 10px; flex-wrap: wrap; `;
const CsvBtn = styled.button`
  border: 1px solid rgba(52,211,153,0.3); border-radius: 12px; padding: 10px 16px; cursor: pointer; font-weight: 700;
  background: rgba(52,211,153,0.16); color: #34d399;
  &:hover { background: rgba(52,211,153,0.24); }
`;
const Content = styled.div` padding: 22px 24px; min-width: 0; `;
