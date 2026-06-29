import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Dropdown } from '@shared/ui/Dropdown';
import {useCourierQuery, useUpdateCourierMutation, useUpdateOrderStatusMutation} from '@app/hooks/dataApi';
import { courierLocationOptions, getStatusLabelOptions } from '@features/select-courier-status/SelectCourierStatus';
import { api } from '@shared/api/base';
import type { Courier, Order, OrderStatus } from '@shared/types';
import { toast } from 'react-toastify';
import { formatTime } from '@shared/utils/date';

const PageRoot = styled.main`
  padding: 32px;
  box-sizing: border-box;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  flex-wrap: wrap;
`;

const TitleGroup = styled.div`
  display: grid;
  gap: 8px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.8rem;
`;

const Subtitle = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 0;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 20px;
  border: none;
  background: none;
  color: ${({ $active }) => ($active ? '#fff' : 'rgba(255,255,255,0.5)')};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border-bottom: 2px solid ${({ $active }) => ($active ? '#4f8fff' : 'transparent')};
  transition: all 0.15s;
  &:hover { color: #fff; }
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
`;

const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  padding: 10px 0;
  align-items: center;
  &:not(:last-child) { border-bottom: 1px solid rgba(255,255,255,0.04); }
`;

const Label = styled.span`
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
`;

const Value = styled.span`
  font-weight: 500;
`;

const FormField = styled.div`
  display: grid;
  gap: 6px;
  margin-bottom: 16px;
`;

const OrderCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const OrderCode = styled.span`
  font-weight: 700;
  font-size: 15px;
`;

const OrderMeta = styled.div`
  font-size: 13px;
  opacity: 0.6;
  line-height: 1.6;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
`;

const EmptyBlock = styled.div`
  text-align: center;
  padding: 40px;
  opacity: 0.5;
`;

const statusLabels: Record<string, string> = {
  new: 'Նոր', pending: 'Սպասման մեջ', accepted: 'Ընդունված', cooking: 'Պատրաստվում է',
  ready: 'Պատրաստ է', delivering: 'Առաքվում է', enRoute: 'Ճանապարհին է',
  done: 'Ավարտված', completed: 'Կատարված', cancelled: 'Չեղարկված',
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  new: '#9ca3ff', pending: '#9ca3ff', accepted: '#38bdf8', cooking: '#f59e0b',
  ready: '#38bdf8', delivering: '#9d7cff', enRoute: '#9d7cff',
  done: '#34d399', completed: '#34d399', cancelled: '#ef4444',
};

const COURIER_STATUS_COLOR: Record<string, string> = {
  free: '#34d399', busy: '#f59e0b', offline: '#ef4444', dayOff: '#8b5cf6',
  atRestaurant: '#4f8fff', pickedUp: '#8b5cf6', enRoute: '#f59e0b', delivered: '#34d399',
};

const StatusPill = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}22`};
  border: 1px solid ${({ $color }) => `${$color}44`};
  white-space: nowrap;
`;

type TabKey = 'profile' | 'orders' | 'history' | 'edit';

export default function CourierPage({ id: propId, onClose }: { id?: string; onClose?: () => void } = {}) {
  const params = useParams();
  const navigate = useNavigate();
  const id = propId ?? params.id; // prop when embedded in a drawer, route param on the page
  const { data: courierApi, isPending, refetch } = useCourierQuery(id ?? '');
  const updateOrderStatus = useUpdateOrderStatusMutation();
  const updateCourier = useUpdateCourierMutation(() => { refetch(); toast.success('Պրոֆիլը թարմացվեց'); });

  const [tab, setTab] = useState<TabKey>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', status: '' as Courier['status'], restaurantId: '', maxOrders: 3 });

  const courier: Courier | null = courierApi?.data ?? null;
  const activeOrders = orders.filter((o) => !['done', 'completed', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter((o) => ['done', 'completed'].includes(o.status));

  useEffect(() => {
    if (!id) return;
    api.get<{ data: Order[] }>(`/orders?courierId=${id}&limit=50`).then((res) => {
      if (res.data?.data) setOrders(res.data.data);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (courier) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditForm({
        name: courier.user?.name || '',
        phone: courier.user?.phone || '',
        email: courier.user?.email || '',
        status: courier.status,
        restaurantId: courier.restaurant?.id || '',
        maxOrders: courier.maxOrders ?? 3,
      });
    }
  }, [courier]);

  if (isPending) return <PageRoot><Title>Բեռնում...</Title></PageRoot>;
  if (!courier) return <PageRoot><Title>Առաքիչը չգտնվեց</Title></PageRoot>;

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus.mutateAsync({ id: orderId, status });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: status as OrderStatus } : o)));
      toast.success('Պատվերի կարգավիճակը թարմացվեց');
    } catch { toast.error('Չհաջողվեց թարմացնել կարգավիճակը'); }
  };

  return (
    <PageRoot>
      <Header>
        <TitleGroup>
          <Title>{courier.user?.name}</Title>
          <Subtitle>Առաքիչի պրոֆիլ և պատվերներ</Subtitle>
        </TitleGroup>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <StatusPill $color={COURIER_STATUS_COLOR[courier.status] ?? '#64748b'}>
            {getStatusLabelOptions[courier.status] ?? courier.status}
          </StatusPill>
          <Button variant="secondary" onClick={() => (onClose ? onClose() : navigate('/couriers'))}>
            {onClose ? 'Փակել' : 'Հետ'}
          </Button>
        </div>
      </Header>

      <Tabs>
        <Tab $active={tab === 'profile'} onClick={() => setTab('profile')}>Պրոֆիլ</Tab>
        <Tab $active={tab === 'orders'} onClick={() => setTab('orders')}>Ակտիվ պատվերներ ({activeOrders.length})</Tab>
        <Tab $active={tab === 'history'} onClick={() => setTab('history')}>Պատմություն ({completedOrders.length})</Tab>
        <Tab $active={tab === 'edit'} onClick={() => setTab('edit')}>Խմբագրել</Tab>
      </Tabs>

      {tab === 'profile' && (
        <>
          <Card>
            <InfoRow><Label>Հեռախոս</Label><Value>{courier.user?.phone || '—'}</Value></InfoRow>
            <InfoRow><Label>Էլ. փոստ</Label><Value>{courier.user?.email || '—'}</Value></InfoRow>
            <InfoRow><Label>Ռեստորան</Label><Value>{courier.restaurant?.name || '—'}</Value></InfoRow>
            {/*<InfoRow><Label>Telegram ID</Label><Value>{courier.telegramId || 'Not connected'}</Value></InfoRow>*/}
            {/*<InfoRow><Label>Location</Label><Value>{courier.lat && courier.lng ? `${Number(courier.lat).toFixed(4)}, ${Number(courier.lng).toFixed(4)}` : '—'}</Value></InfoRow>*/}
          </Card>
          <Card>
            {(() => {
              const max = courier.maxOrders ?? 0;
              const active = courier.activeOrdersCount ?? activeOrders.length;
              const free = courier.availableSlots ?? Math.max(0, max - active);
              const full = free <= 0;
              const pct = max > 0 ? Math.min(100, Math.round((active / max) * 100)) : 0;
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                    <span style={{ fontWeight: 600 }}>Բեռնվածություն</span>
                    <span style={{ fontSize: 14 }}>
                      <b>{active} / {max}</b>{' '}
                      <span style={{ color: full ? '#ef4444' : '#34d399', fontWeight: 600 }}>
                        {full ? '· Լրացված է' : `· կարող է ընդունել ևս ${free}`}
                      </span>
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: full ? '#ef4444' : '#34d399', transition: 'width .2s ease' }} />
                  </div>
                </>
              );
            })()}
            <div style={{ opacity: 0.6, fontSize: 13, marginTop: 12 }}>Ավարտված պատվերներ՝ {completedOrders.length}</div>
          </Card>
        </>
      )}

      {tab === 'orders' && (
        <>
          {activeOrders.length === 0 && <EmptyBlock>Ակտիվ պատվերներ չկան</EmptyBlock>}
          {activeOrders.map((order) => (
            <OrderCard key={order.id}>
              <OrderHeader>
                <OrderCode>#{order.code}</OrderCode>
                <StatusPill $color={ORDER_STATUS_COLOR[order.status] ?? '#64748b'}>
                  {statusLabels[order.status] ?? order.status}
                </StatusPill>
              </OrderHeader>
              <OrderMeta>
                <div>🏪 {order.restaurant?.name}</div>
                <div>👤 {order.customerName || '—'} — 📞 {order.customerPhone || '—'}</div>
                <div>📍 {order.deliveryAddress || '—'}</div>
                <div>💰 ${order.price?.toFixed(2)}</div>
              </OrderMeta>
              <Actions>
                {['cooking', 'ready', 'delivering', 'done'].map((s) => {
                  const isActive = order.status === s; // current status → highlighted button
                  return (
                    <Button key={s} variant={isActive ? 'primary' : 'secondary'}
                      style={{
                        fontSize: 12, padding: '6px 12px', minHeight: 0,
                        ...(isActive ? { background: ORDER_STATUS_COLOR[s] ?? '#5d7bff', color: '#fff' } : {}),
                      }}
                      onClick={() => handleStatusUpdate(order.id, s)}
                      disabled={!['pending', 'accepted', 'cooking', 'ready', 'delivering'].includes(order.status)}
                    >
                      {statusLabels[s] || s}
                    </Button>
                  );
                })}
              </Actions>
            </OrderCard>
          ))}
        </>
      )}

      {tab === 'history' && (
        <>
          {completedOrders.length === 0 && <EmptyBlock>Ավարտված պատվերներ չկան</EmptyBlock>}
          {completedOrders.map((order) => (
            <OrderCard key={order.id}>
              <OrderHeader>
                <OrderCode>#{order.code}</OrderCode>
                <StatusPill $color={ORDER_STATUS_COLOR[order.status] ?? '#64748b'}>
                  {statusLabels[order.status] ?? order.status}
                </StatusPill>
              </OrderHeader>
              <OrderMeta>
                <div>🏪 {order.restaurant?.name}</div>
                <div>💰 ${order.price?.toFixed(2)}</div>
                <div>📅 {formatTime(order.createdAt)}</div>
              </OrderMeta>
            </OrderCard>
          ))}
        </>
      )}

      {tab === 'edit' && (
        <Card>
          <FormField>
            <Label>Անուն</Label>
            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </FormField>
          <FormField>
            <Label>Հեռախոս</Label>
            <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          </FormField>
          <FormField>
            <Label>Էլ. փոստ</Label>
            <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          </FormField>
          <FormField>
            <Label>Կարգավիճակ</Label>
            <Dropdown
              value={editForm.status}
              options={courierLocationOptions}
              onChange={(v) => setEditForm({ ...editForm, status: v as Courier['status'] })}
              triggerDisplay="chip"
            />
          </FormField>
          <FormField>
            <Label>Առավելագույն պատվերներ (բեռնվածություն)</Label>
            <Input
              type="number"
              min={0}
              value={String(editForm.maxOrders)}
              onChange={(e) => setEditForm({ ...editForm, maxOrders: Number(e.target.value) })}
            />
          </FormField>
          <Button
            variant="primary"
            onClick={() => updateCourier.mutateAsync({ id: id!, payload: editForm })}
          >
            Պահպանել
          </Button>
        </Card>
      )}
    </PageRoot>
  );
}
