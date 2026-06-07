import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '@app/providers/AuthProvider';
import { StatusBadge } from '@shared/ui/StatusBadge';
import { api } from '@shared/api/base';
import { formatTime } from '@shared/utils/date';
import type { Order } from '@shared/types';
import type { CourierStatus } from '@shared/types/Courier';
import {
  useGetMe, useOrdersQuery,
  useUpdateMyStatusMutation,
  useUpdateOrderCourierStatusMutation,
  useUpdateOrderStatusMutation,
} from '@app/hooks/dataApi';

const Page = styled.div`
  min-height: 100vh;
  background: #090b11;
  color: #fff;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding-bottom: 100px;
`;

const UserHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const Avatar = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #4f8fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: 700;
  font-size: 17px;
`;

const UserRole = styled.div`
  font-size: 12px;
  opacity: 0.5;
  margin-top: 2px;
`;

const LogoutBtn = styled.button`
  background: rgba(255, 59, 48, 0.15);
  border: none;
  color: #ff3b30;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.6;
`;

const MyStatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  cursor: pointer;
  &:active { opacity: 0.7; }
`;

const MyStatusLabel = styled.span`
  font-size: 13px;
  opacity: 0.5;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatusDot = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  display: inline-block;
  margin-right: 8px;
`;

const StatusValue = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #fff;
`;

const Chevron = styled.span`
  margin-left: auto;
  opacity: 0.3;
  font-size: 14px;
`;

const FilterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const FilterTrigger = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:active { opacity: 0.7; }
`;

const FilterBadge = styled.span`
  padding: 2px 10px;
  border-radius: 20px;
  background: rgba(79, 143, 255, 0.2);
  color: #4f8fff;
  font-size: 12px;
  font-weight: 600;
`;

const Overlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition: opacity 0.2s;
  z-index: 99;
`;

const Sheet = styled.div<{ $open: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 70vh;
  background: #141824;
  border-radius: 20px 20px 0 0;
  padding: 20px 16px 32px;
  transform: translateY(${({ $open }) => ($open ? '0' : '100%')});
  transition: transform 0.25s ease;
  z-index: 100;
`;

const SheetHandle = styled.div`
  width: 36px;
  height: 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 auto 20px;
`;

const SheetTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;
`;

const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const OptionItem = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border: none;
  border-radius: 12px;
  background: ${({ $active }) => ($active ? 'rgba(79,143,255,0.15)' : 'transparent')};
  color: ${({ $active }) => ($active ? '#4f8fff' : 'rgba(255,255,255,0.8)')};
  font-size: 15px;
  font-weight: ${({ $active }) => ($active ? '700' : '500')};
  cursor: pointer;
  &:active { background: rgba(255,255,255,0.04); }
`;

const OptionCheck = styled.span`
  color: #4f8fff;
  font-size: 18px;
`;

const OrderCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
`;

const OrderHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const OrderCode = styled.span`
  font-weight: 700;
  font-size: 15px;
`;

const OrderDetail = styled.div`
  font-size: 13px;
  opacity: 0.6;
  line-height: 1.7;
  margin-bottom: 12px;
`;

const OrderMetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 11px;
  opacity: 0.4;
`;

const CourierStatusActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
`;

const CourierActionBtn = styled.button<{ $color?: string }>`
  padding: 8px 14px;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  background: ${({ $color }) => $color || '#4f8fff'};
  color: #fff;
  &:active { opacity: 0.7; }
`;

const PaginationRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
`;

const PageBtn = styled.button<{ $disabled?: boolean }>`
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: ${({ $disabled }) => ($disabled ? 'rgba(255,255,255,0.2)' : '#fff')};
  font-size: 13px;
  font-weight: 600;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  &:active { opacity: ${({ $disabled }) => ($disabled ? 1 : 0.7)}; }
`;

const PageInfo = styled.span`
  font-size: 13px;
  opacity: 0.5;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 32px;
  opacity: 0.4;
  font-size: 14px;
`;

const Loader = styled.div`
  text-align: center;
  padding: 24px;
  opacity: 0.4;
  font-size: 13px;
`;

const ORDER_STATUS_FLOW: Record<string, string[]> = {
  pending: ['accepted', 'enRoute'],
  accepted: ['cooking', 'enRoute'],
  cooking: ['ready', 'enRoute'],
  ready: ['delivering'],
  delivering: ['completed'],
  enRoute: ['completed'],
};

const ALL_STATUSES: CourierStatus[] = ['free', 'busy', 'offline', 'dayOff', 'atRestaurant', 'pickedUp', 'enRoute', 'delivered'];

const COURIER_STATUS_FLOW: CourierStatus[] = ['atRestaurant', 'pickedUp', 'enRoute', 'delivered'];

const STATUS_CONFIG: Record<CourierStatus, { label: string; color: string }> = {
  free: { label: 'Free', color: '#34d399' },
  busy: { label: 'Busy', color: '#f59e0b' },
  offline: { label: 'Offline', color: '#ef4444' },
  dayOff: { label: 'Day Off', color: '#8b5cf6' },
  atRestaurant: { label: 'At Restaurant', color: '#4f8fff' },
  pickedUp: { label: 'Picked Up', color: '#8b5cf6' },
  enRoute: { label: 'En Route', color: '#f59e0b' },
  delivered: { label: 'Delivered', color: '#34d399' },
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'cooking', label: 'Cooking' },
  { key: 'ready', label: 'Ready' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'delivering', label: 'Delivering' },
  { key: 'enRoute', label: 'En Route' },
  { key: 'done', label: 'Done' },
  { key: 'completed', label: 'Completed' },
];

const PAGE_SIZE = 10;

export default function CourierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const courierId = user?.id || '';

  const { data: courierData, refetch: refetchCourier } = useGetMe(courierId);
  const courier = courierData?.data;
  const courierStatus = courier?.status || 'free';

  const updateStatusMut = useUpdateMyStatusMutation();
  const updateOrderCourierStatusMut = useUpdateOrderCourierStatusMutation();
  const updateOrderStatusMut = useUpdateOrderStatusMutation();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'filter' | 'status'>('filter');
  const { data: orders,isPending:loadingOrders } = useOrdersQuery({courierId,status: filter, search: ''});

  const handleStatusChange = (status: CourierStatus) => {
    updateStatusMut.mutate(
      { status },
      { onSuccess: () => refetchCourier() },
    );
  };

  const handleOrderCourierStatus = (orderId: string, courierStatus: CourierStatus) => {
    updateOrderCourierStatusMut.mutate(
      { orderId, courierStatus },
    );
  };

  const handleOrderStatusChange = (orderId: string, status: string) => {
    updateOrderStatusMut.mutate(
      { id: orderId, status },
    );
  };

  const handleFilterSelect = (key: string) => {
    setFilter(key);
    setPage(1);
    setSheetOpen(false);
  };

  const activeFilterLabel = FILTERS.find((f) => f.key === filter)?.label || 'All';

  const courierStatusStr = courierStatus as CourierStatus;

  return (
    <Page>
      <UserHeader>
        <Avatar>{user?.name?.[0]?.toUpperCase() || 'C'}</Avatar>
        <UserInfo>
          <UserName>{user?.name || 'Courier'}</UserName>
          <UserRole>Courier</UserRole>
        </UserInfo>
        <LogoutBtn onClick={() => { logout(); navigate('/login'); }}>Logout</LogoutBtn>
      </UserHeader>

      <MyStatusRow onClick={() => { setSheetMode('status'); setSheetOpen(true); }}>
        <MyStatusLabel>My Status</MyStatusLabel>
        <StatusDot $color={STATUS_CONFIG[courierStatusStr]?.color || '#64748b'} />
        <StatusValue style={{ color: STATUS_CONFIG[courierStatusStr]?.color || '#fff' }}>
          {STATUS_CONFIG[courierStatusStr]?.label || courierStatusStr}
        </StatusValue>
        <Chevron>›</Chevron>
      </MyStatusRow>

      <SectionTitle>Orders</SectionTitle>

      <FilterHeader>
        <FilterTrigger onClick={() => { setSheetMode('filter'); setSheetOpen(true); }}>
          Filter: <FilterBadge>{activeFilterLabel}</FilterBadge>
        </FilterTrigger>
      </FilterHeader>

      {loadingOrders && <Loader>Loading orders...</Loader>}

      {orders?.length === 0 && (
        <EmptyState>No orders found for this filter</EmptyState>
      )}

      {!loadingOrders && orders?.map((order) => (
        <OrderCard key={order.id}>
          <OrderHeaderRow>
            <OrderCode>#{order.code}</OrderCode>
            {order.courierStatus ? (
              <StatusBadge status={order.courierStatus} />
            ) : (
              <StatusBadge status={order.status} />
            )}
          </OrderHeaderRow>

          <OrderDetail>
            {order.customerName && <div>👤 {order.customerName}{order.customerPhone ? ` — ${order.customerPhone}` : ''}</div>}
            {order.deliveryAddress && <div>📍 {order.deliveryAddress}</div>}
            {order.restaurant?.name && <div>🏪 {order.restaurant.name}</div>}
            <div>💰 ${order.price?.toFixed(2)}</div>
          </OrderDetail>

          {!['done', 'completed', 'cancelled'].includes(order.status) && (
            <>
              <CourierStatusActions>
                {(() => {
                  const currentIdx = COURIER_STATUS_FLOW.indexOf(order.courierStatus as CourierStatus);
                  return COURIER_STATUS_FLOW.map((step) => {
                    const stepIdx = COURIER_STATUS_FLOW.indexOf(step);
                    const isNext = currentIdx === stepIdx - 1;
                    const isFirst = stepIdx === 0 && !order.courierStatus;
                    if (!isNext && !isFirst) return null;
                    return (
                      <CourierActionBtn
                        key={step}
                        $color={STATUS_CONFIG[step].color}
                        onClick={() => handleOrderCourierStatus(order.id, step)}
                      >
                        {STATUS_CONFIG[step].label}
                      </CourierActionBtn>
                    );
                  });
                })()}
              </CourierStatusActions>
              {ORDER_STATUS_FLOW[order.status] && ORDER_STATUS_FLOW[order.status].length > 0 && (
                <CourierStatusActions>
                  {ORDER_STATUS_FLOW[order.status].map((nextStatus) => (
                    <CourierActionBtn
                      key={nextStatus}
                      $color="#4f8fff"
                      onClick={() => handleOrderStatusChange(order.id, nextStatus)}
                    >
                      → {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                    </CourierActionBtn>
                  ))}
                </CourierStatusActions>
              )}
            </>
          )}

          <OrderMetaRow>
            <span>#{order.code}</span>
            <span>{formatTime(order.createdAt)}</span>
          </OrderMetaRow>
        </OrderCard>
      ))}

      {totalPages > 1 && (
        <PaginationRow>
          <PageBtn $disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            ← Prev
          </PageBtn>
          <PageInfo>
            {page} / {totalPages}
          </PageInfo>
          <PageBtn $disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next →
          </PageBtn>
        </PaginationRow>
      )}

      <Overlay $open={sheetOpen} onClick={() => setSheetOpen(false)} />
      <Sheet $open={sheetOpen}>
        <SheetHandle />
        <SheetTitle>{sheetMode === 'filter' ? 'Filter by status' : 'Change my status'}</SheetTitle>
        <OptionList>
          {(sheetMode === 'filter' ? FILTERS : ALL_STATUSES).map((item) => {
            const key = typeof item === 'string' ? item : item.key;
            const label = typeof item === 'string' ? STATUS_CONFIG[item as CourierStatus]?.label || item : item.label;
            const isActive = sheetMode === 'filter' ? filter === key : courierStatusStr === key;
            const color = sheetMode === 'status' ? STATUS_CONFIG[key as CourierStatus]?.color : undefined;
            return (
              <OptionItem
                key={key}
                $active={isActive}
                onClick={() => {
                  if (sheetMode === 'filter') {
                    handleFilterSelect(key);
                  } else {
                    handleStatusChange(key as CourierStatus);
                    setSheetOpen(false);
                  }
                }}
              >
                <span style={color ? { color } : undefined}>
                  {label}
                </span>
                {isActive && <OptionCheck>✓</OptionCheck>}
              </OptionItem>
            );
          })}
        </OptionList>
      </Sheet>
    </Page>
  );
}
