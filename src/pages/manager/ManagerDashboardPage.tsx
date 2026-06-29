import { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { Dropdown } from '@shared/ui/Dropdown';
import { DateRangePicker, type DateRange } from '@shared/ui/DateRangePicker';
import { useAuth } from '@app/providers/AuthProvider';
import {
  useManagerRestaurantsQuery, useSalesOverviewQuery, useTopItemsQuery,
  downloadOrdersCsv, type SalesBreakdown,
} from '@app/hooks/managerApi';

const API_IMG_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5000';
const resolveImg = (u?: string | null) =>
  !u ? '' : u.startsWith('http') || u.startsWith('//') ? u : `${API_IMG_BASE}${u}`;

const money = (v: number) => `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (v: number) => Number(v || 0).toLocaleString('ru-RU');

const BAR_COLORS = ['#5d7bff', '#34d399', '#f59e0b', '#9d7cff', '#38bdf8', '#ef4444', '#f472b6'];

export default function ManagerDashboardPage() {
  const { user, logout } = useAuth();
  const [restaurantId, setRestaurantId] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });

  const dateFrom = dateRange.start ? dateRange.start.toISOString() : undefined;
  const dateTo = dateRange.end ? dateRange.end.toISOString() : undefined;
  const params = { restaurantId: restaurantId || undefined, dateFrom, dateTo };

  const { data: restaurants = [] } = useManagerRestaurantsQuery();
  const { data: overview, isPending } = useSalesOverviewQuery(params);
  const { data: topItems = [] } = useTopItemsQuery({ ...params, limit: 10 });

  const restaurantOptions = useMemo(
    () => [{ value: '', label: 'Все рестораны' }, ...restaurants.map((r) => ({ value: r.id, label: r.name }))],
    [restaurants],
  );
  const activeLogo = restaurants.find((r) => r.id === restaurantId)?.logo || restaurants[0]?.logo;

  const kpis = overview?.kpis;

  return (
    <Page>
      <TopBar>
        <Brand>
          {activeLogo ? <Logo src={resolveImg(activeLogo)} alt="" /> : <LogoFallback>🍽️</LogoFallback>}
          <div>
            <Title>Продажи и отчёты</Title>
            <Sub>{user?.name || user?.email}</Sub>
          </div>
        </Brand>
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
          <LogoutBtn onClick={logout} title="Выйти">⎋</LogoutBtn>
        </Controls>
      </TopBar>

      <KpiRow>
        <KpiCard $accent="#34d399">
          <KpiLabel>Выручка</KpiLabel>
          <KpiValue>{money(kpis?.revenue ?? 0)}</KpiValue>
        </KpiCard>
        <KpiCard $accent="#5d7bff">
          <KpiLabel>Заказы</KpiLabel>
          <KpiValue>{num(kpis?.ordersCount ?? 0)}</KpiValue>
          <KpiHint>Выполнено: {num(kpis?.completedCount ?? 0)}</KpiHint>
        </KpiCard>
        <KpiCard $accent="#f59e0b">
          <KpiLabel>Средний чек</KpiLabel>
          <KpiValue>{money(kpis?.avgCheck ?? 0)}</KpiValue>
        </KpiCard>
        <KpiCard $accent="#ef4444">
          <KpiLabel>Отменённые</KpiLabel>
          <KpiValue>{num(kpis?.cancelledCount ?? 0)}</KpiValue>
        </KpiCard>
      </KpiRow>

      <Panel>
        <PanelTitle>Динамика выручки</PanelTitle>
        {overview && overview.timeseries.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={overview.timeseries} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.45)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.45)" fontSize={12} width={64} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => money(Number(v))} />
              <Area type="monotone" dataKey="revenue" name="Выручка" stroke="#34d399" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Empty>{isPending ? 'Загрузка…' : 'Нет данных за период'}</Empty>
        )}
      </Panel>

      <PanelGrid>
        <BreakdownPanel title="По филиалам" data={overview?.byBranch} />
        <BreakdownPanel title="По оплате" data={overview?.byPayMethod} />
        <BreakdownPanel title="По типу заказа" data={overview?.byOrderType} />
      </PanelGrid>

      <Panel>
        <PanelTitle>Топ блюд</PanelTitle>
        {topItems.length > 0 ? (
          <Table>
            <thead>
              <tr><Th>#</Th><Th>Блюдо</Th><Th $right>Кол-во</Th><Th $right>Выручка</Th></tr>
            </thead>
            <tbody>
              {topItems.map((it, i) => (
                <tr key={it.menuItemId || i}>
                  <Td>{i + 1}</Td>
                  <Td>{it.name}</Td>
                  <Td $right>{num(it.qty)}</Td>
                  <Td $right>{money(it.revenue)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Empty>Нет данных за период</Empty>
        )}
      </Panel>
    </Page>
  );
}

function BreakdownPanel({ title, data }: { title: string; data?: SalesBreakdown[] }) {
  const rows = (data ?? []).slice().sort((a, b) => b.revenue - a.revenue);
  return (
    <Panel>
      <PanelTitle>{title}</PanelTitle>
      {rows.length > 0 ? (
        <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 42)}>
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
            <XAxis type="number" stroke="rgba(255,255,255,0.45)" fontSize={11} tickFormatter={(v) => money(v)} />
            <YAxis type="category" dataKey="label" stroke="rgba(255,255,255,0.6)" fontSize={12} width={96} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.04)' }} formatter={(v) => money(Number(v))} />
            <Bar dataKey="revenue" name="Выручка" radius={[0, 6, 6, 0]}>
              {rows.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Empty>Нет данных</Empty>
      )}
    </Panel>
  );
}

const TOOLTIP_STYLE = {
  background: '#151a24',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  color: '#fff',
};

/* ---------- styles ---------- */
const Page = styled.div`
  min-height: 100vh;
  background: radial-gradient(circle at top left, rgba(74, 84, 169, 0.18), transparent 30%), #090b11;
  color: #fff;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;
const TopBar = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  flex-wrap: wrap; margin-bottom: 22px;
`;
const Brand = styled.div` display: flex; align-items: center; gap: 12px; min-width: 0; `;
const Logo = styled.img` width: 48px; height: 48px; border-radius: 12px; object-fit: cover; border: 1px solid rgba(255,255,255,0.12); `;
const LogoFallback = styled.div`
  width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  font-size: 24px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04);
`;
const Title = styled.h1` margin: 0; font-size: 22px; `;
const Sub = styled.div` font-size: 13px; opacity: 0.6; `;
const Controls = styled.div` display: flex; align-items: center; gap: 12px; flex-wrap: wrap; `;
const CsvBtn = styled.button`
  border: none; border-radius: 12px; padding: 10px 16px; cursor: pointer; font-weight: 700;
  background: rgba(52,211,153,0.16); color: #34d399; border: 1px solid rgba(52,211,153,0.3);
  &:hover { background: rgba(52,211,153,0.24); }
`;
const LogoutBtn = styled.button`
  width: 40px; height: 40px; border-radius: 10px; cursor: pointer; font-size: 16px;
  border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color: #fff;
`;
const KpiRow = styled.div`
  display: grid; gap: 14px; margin-bottom: 18px;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
`;
const KpiCard = styled.div<{ $accent: string }>`
  background: #121722; border: 1px solid rgba(255,255,255,0.07); border-left: 3px solid ${({ $accent }) => $accent};
  border-radius: 14px; padding: 16px 18px; display: flex; flex-direction: column; gap: 6px;
`;
const KpiLabel = styled.div` font-size: 13px; opacity: 0.6; `;
const KpiValue = styled.div` font-size: 26px; font-weight: 800; `;
const KpiHint = styled.div` font-size: 12px; opacity: 0.5; `;
const Panel = styled.section`
  background: #121722; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px;
  padding: 18px; margin-bottom: 18px; min-width: 0;
`;
const PanelGrid = styled.div`
  display: grid; gap: 18px; margin-bottom: 0;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  & > * { margin-bottom: 18px; }
`;
const PanelTitle = styled.h2` margin: 0 0 14px; font-size: 16px; font-weight: 700; `;
const Empty = styled.div` text-align: center; opacity: 0.45; padding: 48px 0; `;
const Table = styled.table`
  width: 100%; border-collapse: collapse; font-size: 14px;
`;
const Th = styled.th<{ $right?: boolean }>`
  text-align: ${({ $right }) => ($right ? 'right' : 'left')};
  padding: 8px 10px; font-size: 12px; opacity: 0.55; font-weight: 600;
  border-bottom: 1px solid rgba(255,255,255,0.08);
`;
const Td = styled.td<{ $right?: boolean }>`
  text-align: ${({ $right }) => ($right ? 'right' : 'left')};
  padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05);
`;
