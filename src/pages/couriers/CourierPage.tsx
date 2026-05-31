import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Dropdown } from '@shared/ui/Dropdown';
import { StatusBadge } from '@shared/ui/StatusBadge';
import {useCourierQuery, useUpdateCourierMutation, useUpdateOrderStatusMutation} from '@app/hooks/dataApi';
import { courierLocationOptions } from '@features/select-courier-status/SelectCourierStatus';
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
  pending: 'Pending', accepted: 'Accepted', cooking: 'Cooking',
  ready: 'Ready', delivering: 'Delivering', done: 'Done', completed: 'Completed',
};

type TabKey = 'profile' | 'orders' | 'history' | 'edit';

export default function CourierPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: courierApi, isPending, refetch } = useCourierQuery(id ?? '');
  const updateOrderStatus = useUpdateOrderStatusMutation();
  const updateCourier = useUpdateCourierMutation(() => { refetch(); toast.success('Profile updated'); });

  const [tab, setTab] = useState<TabKey>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', status: '' as Courier['status'], restaurantId: '' });

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
      });
    }
  }, [courier]);

  if (isPending) return <PageRoot><Title>Loading...</Title></PageRoot>;
  if (!courier) return <PageRoot><Title>Courier not found</Title></PageRoot>;

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus.mutateAsync({ id: orderId, status });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: status as OrderStatus } : o)));
      toast.success('Order status updated');
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <PageRoot>
      <Header>
        <TitleGroup>
          <Title>{courier.user?.name}</Title>
          <Subtitle>Courier profile and order management</Subtitle>
        </TitleGroup>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <StatusBadge status={courier.status} />
          <Button variant="secondary" onClick={() => navigate('/couriers')}>Back</Button>
        </div>
      </Header>

      <Tabs>
        <Tab $active={tab === 'profile'} onClick={() => setTab('profile')}>Profile</Tab>
        <Tab $active={tab === 'orders'} onClick={() => setTab('orders')}>Active orders ({activeOrders.length})</Tab>
        <Tab $active={tab === 'history'} onClick={() => setTab('history')}>History ({completedOrders.length})</Tab>
        <Tab $active={tab === 'edit'} onClick={() => setTab('edit')}>Edit</Tab>
      </Tabs>

      {tab === 'profile' && (
        <>
          <Card>
            <InfoRow><Label>Phone</Label><Value>{courier.user?.phone || '—'}</Value></InfoRow>
            <InfoRow><Label>Email</Label><Value>{courier.user?.email || '—'}</Value></InfoRow>
            <InfoRow><Label>Restaurant</Label><Value>{courier.restaurant?.name || '—'}</Value></InfoRow>
            {/*<InfoRow><Label>Telegram ID</Label><Value>{courier.telegramId || 'Not connected'}</Value></InfoRow>*/}
            {/*<InfoRow><Label>Location</Label><Value>{courier.lat && courier.lng ? `${Number(courier.lat).toFixed(4)}, ${Number(courier.lng).toFixed(4)}` : '—'}</Value></InfoRow>*/}
          </Card>
          <Card>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Active orders: {activeOrders.length}</div>
            <div style={{ opacity: 0.6, fontSize: 13 }}>Completed orders: {completedOrders.length}</div>
          </Card>
        </>
      )}

      {tab === 'orders' && (
        <>
          {activeOrders.length === 0 && <EmptyBlock>No active orders</EmptyBlock>}
          {activeOrders.map((order) => (
            <OrderCard key={order.id}>
              <OrderHeader>
                <OrderCode>#{order.code}</OrderCode>
                <StatusBadge status={order.status} />
              </OrderHeader>
              <OrderMeta>
                <div>🏪 {order.restaurant?.name}</div>
                <div>👤 {order.customerName || '—'} — 📞 {order.customerPhone || '—'}</div>
                <div>📍 {order.deliveryAddress || '—'}</div>
                <div>💰 ${order.price?.toFixed(2)}</div>
              </OrderMeta>
              <Actions>
                {['cooking', 'ready', 'delivering', 'done'].map((s) => (
                  <Button key={s} variant="secondary" style={{ fontSize: 12, padding: '6px 12px', minHeight: 0 }}
                    onClick={() => handleStatusUpdate(order.id, s)}
                    disabled={!['pending', 'accepted', 'cooking', 'ready', 'delivering'].includes(order.status)}
                  >
                    {statusLabels[s] || s}
                  </Button>
                ))}
              </Actions>
            </OrderCard>
          ))}
        </>
      )}

      {tab === 'history' && (
        <>
          {completedOrders.length === 0 && <EmptyBlock>No completed orders</EmptyBlock>}
          {completedOrders.map((order) => (
            <OrderCard key={order.id}>
              <OrderHeader>
                <OrderCode>#{order.code}</OrderCode>
                <StatusBadge status={order.status} />
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
            <Label>Name</Label>
            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </FormField>
          <FormField>
            <Label>Phone</Label>
            <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          </FormField>
          <FormField>
            <Label>Email</Label>
            <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          </FormField>
          <FormField>
            <Label>Status</Label>
            <Dropdown
              value={editForm.status}
              options={courierLocationOptions}
              onChange={(v) => setEditForm({ ...editForm, status: v as Courier['status'] })}
              triggerDisplay="chip"
            />
          </FormField>
          <Button
            variant="primary"
            onClick={() => updateCourier.mutateAsync({ id: id!, payload: editForm })}
          >
            Save
          </Button>
        </Card>
      )}
    </PageRoot>
  );
}
