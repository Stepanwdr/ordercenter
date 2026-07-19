import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useManagerOrdersQuery } from '@app/hooks/managerApi';
import { useManagerCtx } from './ManagerLayout';

const money = (v: number) => `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (s?: string | null) => (s ? new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');

const STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Ожидает', color: '#9ca3ff' },
  accepted: { label: 'Принят', color: '#38bdf8' },
  cooking: { label: 'Готовится', color: '#f59e0b' },
  ready: { label: 'Готов', color: '#38bdf8' },
  delivering: { label: 'Доставка', color: '#9d7cff' },
  enRoute: { label: 'В пути', color: '#9d7cff' },
  done: { label: 'Завершён', color: '#34d399' },
  completed: { label: 'Завершён', color: '#34d399' },
  cancelled: { label: 'Отменён', color: '#ef4444' },
};
const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'pending', label: 'Ожидают' },
  { key: 'cooking', label: 'Готовятся' },
  { key: 'delivering', label: 'Доставка' },
  { key: 'done', label: 'Завершённые' },
  { key: 'cancelled', label: 'Отменённые' },
];
const PAGE_SIZE = 20;

export default function ManagerOrdersPage() {
  const { restaurantId, dateFrom, dateTo } = useManagerCtx();
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the filters change.
  useEffect(() => { setPage(1); }, [status, restaurantId, dateFrom, dateTo]);

  const { data, isPending } = useManagerOrdersQuery({
    restaurantId: restaurantId || undefined,
    dateFrom, dateTo, status, page, limit: PAGE_SIZE,
  });
  const orders = data?.data ?? [];
  const totalPages = Math.max(1, data?.meta?.totalPages ?? 1);
  const total = data?.meta?.total ?? 0;

  return (
    <div>
      <Filters>
        {FILTERS.map((f) => (
          <FilterBtn key={f.key} $active={status === f.key} onClick={() => setStatus(f.key)}>{f.label}</FilterBtn>
        ))}
        <Count>Всего: {total}</Count>
      </Filters>

      <Panel>
        {isPending ? (
          <Empty>Загрузка…</Empty>
        ) : orders.length === 0 ? (
          <Empty>Нет заказов</Empty>
        ) : (
          <Scroll>
            <Table>
              <thead>
                <tr>
                  <Th>Код</Th><Th>Дата</Th><Th>Статус</Th><Th>Клиент</Th><Th>Телефон</Th>
                  <Th>Адрес</Th><Th>Филиал</Th><Th>Курьер</Th><Th>Оплата</Th><Th $right>Сумма</Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const st = STATUS[o.status] || { label: o.status, color: '#64748b' };
                  return (
                    <tr key={o.id}>
                      <Td>{o.code}</Td>
                      <Td>{fmt(o.createdAt)}</Td>
                      <Td><Chip $color={st.color}>{st.label}</Chip></Td>
                      <Td>{o.customerName || '—'}</Td>
                      <Td>{o.customerPhone || '—'}</Td>
                      <Td title={o.deliveryAddress || ''}>{o.deliveryAddress || '—'}</Td>
                      <Td>{o.branch?.name || '—'}</Td>
                      <Td>{o.courierName || '—'}</Td>
                      <Td>{o.payMethod || '—'}{o.paid ? ' ✓' : ''}</Td>
                      <Td $right><b>{money(o.price)}</b></Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Scroll>
        )}
      </Panel>

      {totalPages > 1 && (
        <Pager>
          <PageBtn disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Назад</PageBtn>
          <PageInfo>{page} / {totalPages}</PageInfo>
          <PageBtn disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Вперёд →</PageBtn>
        </Pager>
      )}
    </div>
  );
}

/* ---------- styles ---------- */
const Filters = styled.div` display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; `;
const FilterBtn = styled.button<{ $active?: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? 'rgba(79,143,255,0.6)' : 'rgba(255,255,255,0.12)')};
  background: ${({ $active }) => ($active ? 'rgba(79,143,255,0.18)' : 'rgba(255,255,255,0.04)')};
  color: ${({ $active }) => ($active ? '#fff' : 'rgba(255,255,255,0.72)')};
  border-radius: 999px; padding: 8px 14px; cursor: pointer; font-weight: 600; font-size: 13px;
`;
const Count = styled.span` margin-left: auto; color: rgba(255,255,255,0.55); font-size: 13px; `;
const Panel = styled.section` background: #121722; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 12px; min-width: 0; `;
const Scroll = styled.div` overflow-x: auto; `;
const Table = styled.table` width: 100%; border-collapse: collapse; font-size: 13px; white-space: nowrap; `;
const Th = styled.th<{ $right?: boolean }>`
  text-align: ${({ $right }) => ($right ? 'right' : 'left')};
  padding: 10px 12px; font-size: 11px; opacity: 0.55; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.08);
`;
const Td = styled.td<{ $right?: boolean }>`
  text-align: ${({ $right }) => ($right ? 'right' : 'left')};
  padding: 11px 12px; border-bottom: 1px solid rgba(255,255,255,0.05);
  max-width: 220px; overflow: hidden; text-overflow: ellipsis;
`;
const Chip = styled.span<{ $color: string }>`
  padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700;
  color: ${({ $color }) => $color}; background: ${({ $color }) => `${$color}22`}; border: 1px solid ${({ $color }) => `${$color}44`};
`;
const Empty = styled.div` text-align: center; opacity: 0.45; padding: 48px 0; `;
const Pager = styled.div` display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 16px; `;
const PageBtn = styled.button`
  border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.05); color: #fff;
  border-radius: 10px; padding: 9px 16px; cursor: pointer; font-weight: 600;
  &:disabled { opacity: 0.4; cursor: default; }
`;
const PageInfo = styled.span` color: rgba(255,255,255,0.7); font-size: 14px; `;
