import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { isTelegramMiniApp, notifyTelegramReady, getTelegramUser } from '@shared/utils/telegram';
import { courierAppApi } from '@shared/api/courierApp';
import type { Order, Courier } from '@shared/types';
import OrderDetailView from './OrderDetailView';

const Container = styled.div<{ $bg: string }>`
  min-height: 100vh;
  background: ${({ $bg }) => $bg};
  color: ${({ theme }) => theme.colors?.text || '#fff'};
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const Avatar = styled.div<{ $bg: string }>`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  color: #fff;
  flex-shrink: 0;
`;

const CourierName = styled.div`
  font-size: 17px;
  font-weight: 600;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ $status }) =>
    $status === 'free' || $status === 'available' ? 'rgba(52, 211, 99, 0.2)' : 'rgba(255, 199, 0, 0.2)'};
  color: ${({ $status }) =>
    $status === 'free' || $status === 'available' ? '#34d399' : '#ffc700'};
`;

const SectionTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
`;

const OrderCard = styled.div`
  background: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: rgba(255, 255, 255, 0.1); }
  &:active { background: rgba(255, 255, 255, 0.04); }
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

const OrderStatusChip = styled.span<{ $status: string }>`
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $status }) =>
    $status === 'pending' ? 'rgba(255, 199, 0, 0.2)' :
    $status === 'accepted' ? 'rgba(79, 143, 255, 0.2)' :
    $status === 'cooking' ? 'rgba(255, 136, 0, 0.2)' :
    $status === 'ready' ? 'rgba(52, 211, 99, 0.2)' :
    $status === 'delivering' ? 'rgba(157, 124, 255, 0.2)' :
    'rgba(255, 255, 255, 0.08)'};
  color: ${({ $status }) =>
    $status === 'pending' ? '#ffc700' :
    $status === 'accepted' ? '#4f8fff' :
    $status === 'cooking' ? '#ff8800' :
    $status === 'ready' ? '#34d399' :
    $status === 'delivering' ? '#9d7cff' :
    '#fff'};
`;

const OrderInfo = styled.div`
  font-size: 13px;
  opacity: 0.7;
  line-height: 1.5;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  opacity: 0.5;
  font-size: 15px;
`;

const ErrorBox = styled.div`
  background: rgba(255, 59, 48, 0.12);
  color: #ff3b30;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  margin: 16px 0;
  text-align: center;
`;

const Loading = styled.div`
  text-align: center;
  padding: 40px;
  opacity: 0.5;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
`;

const ActionButton = styled.button<{ $variant?: string }>`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: ${({ $variant }) =>
    $variant === 'primary' ? '#4f8fff' :
    $variant === 'success' ? '#34d399' :
    $variant === 'warning' ? '#ffc700' :
    'rgba(255, 255, 255, 0.08)'};
  color: ${({ $variant }) =>
    $variant === 'warning' ? '#000' : '#fff'};
  &:active { opacity: 0.7; }
`;

const NavButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  opacity: 0.6;
  &:hover { opacity: 1; }
`;

const statusLabels: Record<string, string> = {
  pending: 'Սպասվում է',
  accepted: 'Ընդունված',
  cooking: 'Պատրաստվում է',
  ready: 'Պատրաստ է',
  delivering: 'Ճանապարհին',
  completed: 'Ավարտված',
};

export default function CourierApp() {
  const [page, setPage] = useState<'orders' | 'detail'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [courier, setCourier] = useState<Courier | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTelegramMiniApp()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('This app must be opened inside Telegram');
      setLoading(false);
      return;
    }
    notifyTelegramReady();
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [me, orderList] = await Promise.all([
        courierAppApi.getMe().catch(() => null),
        courierAppApi.getOrders(),
      ]);
      if (!me) {
        setError('You are not registered as a courier. Please use /start in the bot first.');
        setLoading(false);
        return;
      }
      setCourier(me);
      setOrders(orderList);
    } catch (err: any) {
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(orderId: string, status: string) {
    try {
      const updated = await courierAppApi.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder(updated);
    } catch (err: any) {
      setError(err?.message || 'Failed to update status');
    }
  }

  function openDetail(order: Order) {
    setSelectedOrder(order);
    setPage('detail');
  }

  function closeDetail() {
    setSelectedOrder(null);
    setPage('orders');
  }

  if (!isTelegramMiniApp()) {
    return (
      <Container $bg="#090b11">
        <ErrorBox>This app must be opened inside Telegram</ErrorBox>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container $bg="#090b11">
        <Loading>Loading...</Loading>
      </Container>
    );
  }

  if (page === 'detail' && selectedOrder) {
    return (
      <OrderDetailView
        order={selectedOrder}
        onBack={closeDetail}
        onStatusUpdate={handleStatusUpdate}
      />
    );
  }

  const activeOrders = orders.filter((o) => !['completed', 'cancelled'].includes(o.status));
  const completedOrders = orders.filter((o) => ['completed', 'cancelled'].includes(o.status));

  return (
    <Container $bg="#090b11">
      {courier && (
        <Header>
          <Avatar $bg="#4f8fff">
            {getTelegramUser()?.first_name?.[0]?.toUpperCase() || 'C'}
          </Avatar>
          <div style={{ flex: 1 }}>
            <CourierName>{courier.user?.name || getTelegramUser()?.first_name || 'Courier'}</CourierName>
            <StatusBadge $status={courier.status}>{courier.status}</StatusBadge>
          </div>
          <ActionButton onClick={loadData} style={{ flex: 0, padding: '8px 14px', fontSize: 13 }}>
            Refresh
          </ActionButton>
        </Header>
      )}

      {error && <ErrorBox>{error}</ErrorBox>}

      <SectionTitle>Active Orders ({activeOrders.length})</SectionTitle>
      {activeOrders.length === 0 && !error && (
        <EmptyState>No active orders right now</EmptyState>
      )}
      {activeOrders.map((order) => (
        <OrderCard key={order.id} onClick={() => openDetail(order)}>
          <OrderHeader>
            <OrderCode>#{order.code}</OrderCode>
            <OrderStatusChip $status={order.status}>
              {statusLabels[order.status] || order.status}
            </OrderStatusChip>
          </OrderHeader>
          <OrderInfo>
            {order.restaurant?.name && <div>🏪 {order.restaurant.name}</div>}
            {order.customerName && <div>👤 {order.customerName}</div>}
            {order.customerPhone && <div>📞 {order.customerPhone}</div>}
            {order.deliveryAddress && <div>📍 {order.deliveryAddress}</div>}
            <div>💰 ${order.price}</div>
          </OrderInfo>
        </OrderCard>
      ))}

      {completedOrders.length > 0 && (
        <>
          <SectionTitle style={{ marginTop: 24 }}>History ({completedOrders.length})</SectionTitle>
          {completedOrders.slice(0, 5).map((order) => (
            <OrderCard key={order.id} onClick={() => openDetail(order)}>
              <OrderHeader>
                <OrderCode>#{order.code}</OrderCode>
                <OrderStatusChip $status={order.status}>
                  {statusLabels[order.status] || order.status}
                </OrderStatusChip>
              </OrderHeader>
              <OrderInfo>
                {order.restaurant?.name && <div>{order.restaurant.name}</div>}
                <div>💰 ${order.price}</div>
              </OrderInfo>
            </OrderCard>
          ))}
        </>
      )}
    </Container>
  );
}
