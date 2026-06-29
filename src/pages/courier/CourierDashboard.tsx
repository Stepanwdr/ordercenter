import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '@app/providers/AuthProvider';
import { api } from '@shared/api/base';
import { formatTime, getDuration } from '@shared/utils/date';
import type { Order } from '@shared/types';
import type { CourierStatus } from '@shared/types/Courier';
import {
  useGetMe, useOrdersPaginatedQuery, useOrderQuery,
  useUpdateMyStatusMutation,
  useUpdateOrderCourierStatusMutation,
  useUpdateOrderStatusMutation,
  useUpdateOrderPayMethodMutation,
} from '@app/hooks/dataApi';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const resolveAvatar = (avatar?: string) => {
  if (!avatar) return '';
  if (avatar.startsWith('http')) return avatar;
  return `${API_BASE}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
};

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
  overflow: hidden;
`;

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
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

const HeaderMenu = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const MenuTrigger = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:active { opacity: 0.7; }
`;

const MenuBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
`;

const MenuDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 190px;
  background: #141824;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 6px;
  z-index: 101;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
`;

const MenuItem = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: ${({ $danger }) => ($danger ? '#ff3b30' : 'rgba(255,255,255,0.85)')};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  &:active { background: rgba(255, 255, 255, 0.05); }
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

const PreviewBody = styled.div`
  max-height: 60vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const PreviewTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
`;

const PreviewClose = styled.button`
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  &:active { opacity: 0.7; }
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

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
`;

const Chip = styled.span<{ $color?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: ${({ $color }) => ($color ? `${$color}22` : 'rgba(255,255,255,0.08)')};
  color: ${({ $color }) => $color || 'rgba(255,255,255,0.8)'};
  border: 1px solid ${({ $color }) => ($color ? `${$color}44` : 'rgba(255,255,255,0.1)')};
`;

const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
`;

const InfoLine = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  line-height: 1.4;
`;

const InfoIcon = styled.span`
  flex-shrink: 0;
  opacity: 0.7;
  font-size: 14px;
`;

const InfoText = styled.div`
  flex: 1;
  color: rgba(255, 255, 255, 0.85);
`;

const InfoSub = styled.div`
  font-size: 12px;
  opacity: 0.5;
  margin-top: 2px;
`;

const PhoneLink = styled.a`
  color: #4f8fff;
  font-weight: 600;
  text-decoration: none;
  &:active { opacity: 0.7; }
`;

const ItemsToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:active { opacity: 0.7; }
`;

const ItemsToggleLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ItemsCount = styled.span`
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(79, 143, 255, 0.2);
  color: #4f8fff;
  font-size: 11px;
  font-weight: 700;
`;

const ItemsChevron = styled.span<{ $open: boolean }>`
  opacity: 0.5;
  font-size: 12px;
  transition: transform 0.2s ease;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
`;

const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
`;

const ItemName = styled.span`
  color: rgba(255, 255, 255, 0.85);
`;

const ItemQty = styled.span`
  color: #4f8fff;
  font-weight: 700;
  margin-right: 6px;
`;

const ItemPrice = styled.span`
  opacity: 0.5;
  font-size: 12px;
  white-space: nowrap;
`;

const TotalsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 12px;
  background: rgba(79, 143, 255, 0.08);
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
`;

const TotalsLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DeliveryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px 8px;
  font-size: 13px;
  opacity: 0.75;
`;

const TimelineGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
`;

const TimelineItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const TimelineLabel = styled.span`
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  opacity: 0.4;
`;

const TimelineValue = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
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

const Stepper = styled.div`
  display: flex;
  align-items: flex-start;
  margin: 4px 0 14px;
`;

const Step = styled.div`
  flex: 1;
  text-align: center;
  position: relative;
`;

const StepConnector = styled.span<{ $filled: boolean }>`
  position: absolute;
  top: 6px;
  left: -50%;
  width: 100%;
  height: 2px;
  background: ${({ $filled }) => ($filled ? '#34d399' : 'rgba(255,255,255,0.12)')};
`;

const StepDot = styled.span<{ $state: 'done' | 'current' | 'todo'; $color: string }>`
  position: relative;
  z-index: 1;
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin: 0 auto 6px;
  background: ${({ $state, $color }) =>
    $state === 'todo' ? 'rgba(255,255,255,0.15)' : $color};
  border: 2px solid ${({ $state, $color }) =>
    $state === 'todo' ? 'rgba(255,255,255,0.15)' : $color};
  box-shadow: ${({ $state, $color }) =>
    $state === 'current' ? `0 0 0 4px ${$color}33` : 'none'};
`;

const StepLabel = styled.span<{ $active: boolean; $color: string }>`
  display: block;
  font-size: 10px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  color: ${({ $active, $color }) => ($active ? $color : 'rgba(255,255,255,0.5)')};
`;

const MainActionBtn = styled.button<{ $color?: string }>`
  display: block;
  width: 100%;
  padding: 14px;
  margin-bottom: 8px;
  border: none;
  border-radius: 13px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: ${({ $color }) => $color || '#4f8fff'};
  &:active { opacity: 0.8; }
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

// Short labels for the delivery-progress stepper at the top of each card.
const STEP_LABELS: Record<CourierStatus, string> = {
  atRestaurant: 'Ռեստորանում',
  pickedUp: 'Վերցրած',
  enRoute: 'Ճանապարհին',
  delivered: 'Հասցված',
  free: '', busy: '', offline: '', dayOff: '',
};

const STATUS_CONFIG: Record<CourierStatus, { label: string; color: string }> = {
  free: { label: 'Ազատ եմ', color: '#34d399' },
  busy: { label: 'Զբաղված եմ', color: '#f59e0b' },
  offline: { label: 'Կապից դուրս եմ', color: '#ef4444' },
  dayOff: { label: 'Աշխատանքի չեմ', color: '#8b5cf6' },
  atRestaurant: { label: 'Ռեստորանում եմ', color: '#4f8fff' },
  pickedUp: { label: 'Պատվերը վերցրել եմ', color: '#8b5cf6' },
  enRoute: { label: 'Ճանապարհին եմ', color: '#f59e0b' },
  delivered: { label: 'Հասել եմ', color: '#34d399' },
};

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: 'Նոր', color: '#9ca3ff' },
  pending: { label: 'Սպասման մեջ', color: '#9ca3ff' },
  accepted: { label: 'Ընդունված', color: '#38bdf8' },
  cooking: { label: 'Պատրաստվում է', color: '#f59e0b' },
  ready: { label: 'Պատրաստ է', color: '#38bdf8' },
  delivering: { label: 'Առաքվում է', color: '#9d7cff' },
  enRoute: { label: 'Ճանապարհին է', color: '#9d7cff' },
  done: { label: 'Ավարտված', color: '#34d399' },
  completed: { label: 'Կատարված', color: '#34d399' },
  cancelled: { label: 'Չեղարկված', color: '#ef4444' },
};

const orderStatusLabel = (status: string) =>
  ORDER_STATUS_CONFIG[status]?.label || status;

const PAY_METHOD_CONFIG: Record<string, { label: string; color: string }> = {
  CASH: { label: '💵 Կանխիկ', color: '#34d399' },
  ONLINE: { label: '💳 Օնլայն', color: '#4f8fff' },
  'BANK-POS': { label: '🏧 Բանկ POS', color: '#8b5cf6' },
  IDRAM: { label: '📲 IDram', color: '#f59e0b' },
};

const PAY_METHODS = ['CASH', 'ONLINE', 'BANK-POS', 'IDRAM'];

const ORDER_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  delivery: { label: '🛵 Առաքում', color: '#4f8fff' },
  takeaway: { label: '🥡 Տանել', color: '#f59e0b' },
  dine_in: { label: '🍽️ Տեղում', color: '#34d399' },
};

// Filter keys must match the backend order `status` values (status === 'all' is ignored server-side).
const FILTERS = [
  { key: 'all', label: 'Բոլորը' },
  { key: 'pending', label: 'Սպասման մեջ' },
  { key: 'accepted', label: 'Ընդունված' },
  { key: 'cooking', label: 'Պատրաստվում է' },
  { key: 'ready', label: 'Պատրաստ է' },
  { key: 'delivering', label: 'Առաքվում է' },
  { key: 'enRoute', label: 'Ճանապարհին է' },
  { key: 'done', label: 'Ավարտված' },
  { key: 'completed', label: 'Կատարված' },
  { key: 'cancelled', label: 'Չեղարկված' },
];

const PAGE_SIZE = 10;

export default function CourierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const courierId = user?.id || '';

  const { data: courierData, refetch: refetchCourier } = useGetMe();
  const courier = courierData?.data;
  const courierStatus = courier?.status || 'free';
  const updateStatusMut = useUpdateMyStatusMutation();
  const updateOrderCourierStatusMut = useUpdateOrderCourierStatusMutation();
  const updateOrderStatusMut = useUpdateOrderStatusMutation();
  const updateOrderPayMethodMut = useUpdateOrderPayMethodMutation();

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('pending');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'filter' | 'status' | 'payment'>('filter');
  const [payOrderId, setPayOrderId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleItems = (orderId: string) => {
    setExpandedItems((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };
  // Server-side filtering + pagination: status/page/limit are resolved by the backend,
  // which returns the page rows plus meta (total, totalPages).
  const { data: ordersResponse, isPending: loadingOrders } = useOrdersPaginatedQuery({
    courierId,
    status: filter,
    search: '',
    page,
    limit: PAGE_SIZE,
  });

  const orders = ordersResponse?.data ?? [];
  const totalPages = Math.max(1, ordersResponse?.meta?.totalPages ?? 1);

  // Clamp current page if the list shrinks (e.g. after filtering)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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

  const openPaymentSheet = (orderId: string) => {
    setPayOrderId(orderId);
    setSheetMode('payment');
    setSheetOpen(true);
  };

  const handlePayMethodSelect = (payMethod: string) => {
    if (payOrderId) {
      updateOrderPayMethodMut.mutate({ id: payOrderId, payMethod });
    }
    setSheetOpen(false);
    setPayOrderId(null);
  };

  const payOrder = orders?.find((o) => o.id === payOrderId);

  // Deep link from the Telegram notification: ?orderId=<id> opens that order's preview sheet.
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkOrderId = searchParams.get('orderId') || undefined;
  const { data: previewOrder } = useOrderQuery(deepLinkOrderId);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (deepLinkOrderId) setPreviewOpen(true);
  }, [deepLinkOrderId]);

  const closePreview = () => {
    setPreviewOpen(false);
    if (deepLinkOrderId) {
      searchParams.delete('orderId');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const activeFilterLabel = FILTERS.find((f) => f.key === filter)?.label || 'Բոլորը';

  const courierStatusStr = courierStatus as CourierStatus;
  console.log(courier)
  return (
    <Page>
      <UserHeader>
        <Avatar>
          {courier?.user?.avatar
            ? <AvatarImg src={courier.user.avatar} alt="sdsd" />
            : (courier?.user?.name?.[0]?.toUpperCase() || 'C')}
        </Avatar>
        <UserInfo>
          <UserName>{courier?.user?.name || 'Առաքիչ'}</UserName>
          <UserRole>Առաքիչ</UserRole>
        </UserInfo>
        <HeaderMenu>
          <MenuTrigger onClick={() => setMenuOpen((o) => !o)} aria-label="Մենյու">⋮</MenuTrigger>
          {menuOpen && (
            <>
              <MenuBackdrop onClick={() => setMenuOpen(false)} />
              <MenuDropdown>
                <MenuItem onClick={() => { setMenuOpen(false); navigate('/settings'); }}>
                  ⚙️ Կարգավորումներ
                </MenuItem>
                <MenuItem $danger onClick={() => { setMenuOpen(false); logout(); navigate('/login'); }}>
                  🚪 Դուրս գալ
                </MenuItem>
              </MenuDropdown>
            </>
          )}
        </HeaderMenu>
      </UserHeader>

      <MyStatusRow onClick={() => { setSheetMode('status'); setSheetOpen(true); }}>
        <MyStatusLabel>Իմ կարգավիճակը</MyStatusLabel>
        <StatusDot $color={STATUS_CONFIG[courierStatusStr]?.color || '#64748b'} />
        <StatusValue style={{ color: STATUS_CONFIG[courierStatusStr]?.color || '#fff' }}>
          {STATUS_CONFIG[courierStatusStr]?.label || courierStatusStr}
        </StatusValue>
        <Chevron>›</Chevron>
      </MyStatusRow>

      <SectionTitle>Պատվերներ</SectionTitle>

      <FilterHeader>
        <FilterTrigger onClick={() => { setSheetMode('filter'); setSheetOpen(true); }}>
          Ֆիլտր՝ <FilterBadge>{activeFilterLabel}</FilterBadge>
        </FilterTrigger>
      </FilterHeader>

      {loadingOrders && <Loader>Բեռնում...</Loader>}

      {!loadingOrders && orders.length === 0 && (
        <EmptyState>Այս ֆիլտրով պատվերներ չկան</EmptyState>
      )}

      {!loadingOrders && orders.map((order) => (
        <OrderCard key={order.id}>
          <OrderHeaderRow>
            <OrderCode>#{order.code}</OrderCode>
            {order.courierStatus ? (
              <Chip $color={STATUS_CONFIG[order.courierStatus]?.color || '#64748b'}>
                {STATUS_CONFIG[order.courierStatus]?.label || order.courierStatus}
              </Chip>
            ) : (
              <Chip $color={ORDER_STATUS_CONFIG[order.status]?.color || '#64748b'}>
                {orderStatusLabel(order.status)}
              </Chip>
            )}
          </OrderHeaderRow>

          {!['done', 'completed', 'cancelled'].includes(order.status) && (
            <Stepper>
              {COURIER_STATUS_FLOW.map((step, i) => {
                const courierIdx = COURIER_STATUS_FLOW.indexOf(order.courierStatus as CourierStatus);
                const state = i < courierIdx ? 'done' : i === courierIdx ? 'current' : 'todo';
                const color = STATUS_CONFIG[step].color;
                return (
                  <Step key={step}>
                    {i > 0 && <StepConnector $filled={i <= courierIdx} />}
                    <StepDot $state={state} $color={state === 'done' ? '#34d399' : color} />
                    <StepLabel $active={state !== 'todo'} $color={color}>
                      {STEP_LABELS[step]}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          )}

          <ChipRow>
            {order.orderType && ORDER_TYPE_CONFIG[order.orderType] && (
              <Chip $color={ORDER_TYPE_CONFIG[order.orderType].color}>
                {ORDER_TYPE_CONFIG[order.orderType].label}
              </Chip>
            )}
            <Chip
              as="button"
              $color={PAY_METHOD_CONFIG[order.payMethod]?.color || '#4f8fff'}
              onClick={() => openPaymentSheet(order.id)}
              style={{ cursor: 'pointer' }}
            >
              {PAY_METHOD_CONFIG[order.payMethod]?.label || '💳 Վճարում'} ✎
            </Chip>
            <Chip $color={order.paid ? '#34d399' : '#ef4444'}>
              {order.paid ? '✓ Վճարված' : '✕ Չվճարված'}
            </Chip>
            {order.prepTime && <Chip>⏱ {order.prepTime}</Chip>}
          </ChipRow>

          <InfoBlock>
            {order.customerName && (
              <InfoLine>
                <InfoIcon>👤</InfoIcon>
                <InfoText>
                  {order.customerName}
                  {(order.customerPhone || order.phone) && (
                    <InfoSub>
                      <PhoneLink href={`tel:${order.customerPhone || order.phone}`}>
                        📞 {order.customerPhone || order.phone}
                      </PhoneLink>
                    </InfoSub>
                  )}
                </InfoText>
              </InfoLine>
            )}

            {order.deliveryAddress && (
              <InfoLine>
                <InfoIcon>📍</InfoIcon>
                <InfoText>
                  {order.deliveryAddress}
                  {(order.entrance || order.floor || order.domofon || order.home) && (
                    <InfoSub>
                      {order.home && `Տուն ${order.home} · `}
                      {order.entrance && `Մուտք ${order.entrance} · `}
                      {order.floor && `Հարկ ${order.floor} · `}
                      {order.domofon && `Դոմոֆոն ${order.domofon}`}
                    </InfoSub>
                  )}
                  {order.addressComment && <InfoSub>💬 {order.addressComment}</InfoSub>}
                </InfoText>
              </InfoLine>
            )}

            {order.restaurant?.name && (
              <InfoLine>
                <InfoIcon>🏪</InfoIcon>
                <InfoText>
                  {order.restaurant.name}
                  {order.branch?.name && <InfoSub>🏬 {order.branch.name}</InfoSub>}
                  {(order.branch?.address || order.restaurant.addresses?.[0]?.address) && (
                    <InfoSub>{order.branch?.address || order.restaurant.addresses?.[0]?.address}</InfoSub>
                  )}
                  {(order.branch?.phone || order.restaurant.phone) && (
                    <InfoSub>
                      <PhoneLink href={`tel:${order.branch?.phone || order.restaurant.phone}`}>
                        📞 {order.branch?.phone || order.restaurant.phone}
                      </PhoneLink>
                    </InfoSub>
                  )}
                </InfoText>
              </InfoLine>
            )}

            {order.operator?.name && (
              <InfoLine>
                <InfoIcon>🎧</InfoIcon>
                <InfoText>Օպերատոր՝ {order.operator.name}</InfoText>
              </InfoLine>
            )}
          </InfoBlock>

          {order.orderItems?.length > 0 && (
            <>
              <ItemsToggle onClick={() => toggleItems(order.id)}>
                <ItemsToggleLabel>
                  🧾 Պատվերի կազմ
                  <ItemsCount>{order.orderItems.length}</ItemsCount>
                </ItemsToggleLabel>
                <ItemsChevron $open={!!expandedItems[order.id]}>▼</ItemsChevron>
              </ItemsToggle>
              {expandedItems[order.id] && (
                <ItemsList>
                  {order.orderItems.map((item) => (
                    <ItemRow key={item.id}>
                      <ItemName>
                        <ItemQty>{item.quantity}×</ItemQty>
                        {item.menuItem?.name || item.name}
                      </ItemName>
                      <ItemPrice>${((item.price ?? item.menuItem?.price ?? 0) * item.quantity).toFixed(2)}</ItemPrice>
                    </ItemRow>
                  ))}
                </ItemsList>
              )}
            </>
          )}

          {Number(order.deliveryFee) > 0 && (
            <DeliveryRow>
              <span>🛵 Առաքման գումարը</span>
              <span>${Number(order.deliveryFee).toFixed(2)}</span>
            </DeliveryRow>
          )}

          <TotalsRow>
            <TotalsLabel>Վճարման ենթակա</TotalsLabel>
            <span>${(order.totalAmount ?? order.price ?? 0).toFixed(2)}</span>
          </TotalsRow>

          {!['done', 'completed', 'cancelled'].includes(order.status) && (
            <>
              {(() => {
                const courierIdx = COURIER_STATUS_FLOW.indexOf(order.courierStatus as CourierStatus);
                const nextStep = COURIER_STATUS_FLOW[courierIdx + 1];
                if (!nextStep) return null;
                return (
                  <MainActionBtn
                    $color={STATUS_CONFIG[nextStep].color}
                    onClick={() => handleOrderCourierStatus(order.id, nextStep)}
                  >
                    ✅ {STATUS_CONFIG[nextStep].label}
                  </MainActionBtn>
                );
              })()}
            </>
          )}

          <OrderMetaRow>
            <span>🕐 {formatTime(order.createdAt)}</span>
            <span>⏳ {getDuration(order.createdAt, order.completedAt)}</span>
          </OrderMetaRow>
        </OrderCard>
      ))}

      {totalPages > 1 && (
        <PaginationRow>
          <PageBtn $disabled={page <= 1} onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0 }); }}>
            ← Նախորդ
          </PageBtn>
          <PageInfo>
            {page} / {totalPages}
          </PageInfo>
          <PageBtn $disabled={page >= totalPages} onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0 }); }}>
            Հաջորդ →
          </PageBtn>
        </PaginationRow>
      )}

      <Overlay $open={sheetOpen} onClick={() => { setSheetOpen(false); setPayOrderId(null); }} />
      <Sheet $open={sheetOpen}>
        <SheetHandle />
        <SheetTitle>
          {sheetMode === 'filter'
            ? 'Ֆիլտր ըստ կարգավիճակի'
            : sheetMode === 'payment'
              ? `Վճարման եղանակ${payOrder ? ` · #${payOrder.code}` : ''}`
              : 'Փոխել կարգավիճակը'}
        </SheetTitle>
        <OptionList>
          {sheetMode === 'payment'
            ? PAY_METHODS.map((method) => {
                const isActive = payOrder?.payMethod === method;
                const color = PAY_METHOD_CONFIG[method]?.color;
                return (
                  <OptionItem
                    key={method}
                    $active={isActive}
                    onClick={() => handlePayMethodSelect(method)}
                  >
                    <span style={color ? { color } : undefined}>
                      {PAY_METHOD_CONFIG[method]?.label || method}
                    </span>
                    {isActive && <OptionCheck>✓</OptionCheck>}
                  </OptionItem>
                );
              })
            : (sheetMode === 'filter' ? FILTERS : ALL_STATUSES).map((item) => {
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

      {/* Deep-link order preview (opened from the Telegram notification link) */}
      <Overlay $open={previewOpen} onClick={closePreview} />
      <Sheet $open={previewOpen}>
        <SheetHandle />
        {previewOrder && (
          <>
            <PreviewTitleRow>
              <SheetTitle style={{ margin: 0 }}>Պատվեր #{previewOrder.code}</SheetTitle>
              <PreviewClose onClick={closePreview} aria-label="Փակել">✕</PreviewClose>
            </PreviewTitleRow>
            <PreviewBody>
              <OrderHeaderRow>
                <Chip $color={(previewOrder.courierStatus ? STATUS_CONFIG[previewOrder.courierStatus]?.color : ORDER_STATUS_CONFIG[previewOrder.status]?.color) || '#64748b'}>
                  {previewOrder.courierStatus
                    ? STATUS_CONFIG[previewOrder.courierStatus]?.label || previewOrder.courierStatus
                    : orderStatusLabel(previewOrder.status)}
                </Chip>
                <span style={{ fontWeight: 700 }}>${(previewOrder.totalAmount ?? previewOrder.price ?? 0).toFixed(2)}</span>
              </OrderHeaderRow>

              <ChipRow>
                {previewOrder.orderType && ORDER_TYPE_CONFIG[previewOrder.orderType] && (
                  <Chip $color={ORDER_TYPE_CONFIG[previewOrder.orderType].color}>
                    {ORDER_TYPE_CONFIG[previewOrder.orderType].label}
                  </Chip>
                )}
                {PAY_METHOD_CONFIG[previewOrder.payMethod] && (
                  <Chip $color={PAY_METHOD_CONFIG[previewOrder.payMethod].color}>
                    {PAY_METHOD_CONFIG[previewOrder.payMethod].label}
                  </Chip>
                )}
                <Chip $color={previewOrder.paid ? '#34d399' : '#ef4444'}>
                  {previewOrder.paid ? '✓ Վճարված' : '✕ Չվճարված'}
                </Chip>
              </ChipRow>

              <InfoBlock>
                {previewOrder.customerName && (
                  <InfoLine>
                    <InfoIcon>👤</InfoIcon>
                    <InfoText>
                      {previewOrder.customerName}
                      {(previewOrder.customerPhone || previewOrder.phone) && (
                        <InfoSub>
                          <PhoneLink href={`tel:${previewOrder.customerPhone || previewOrder.phone}`}>
                            📞 {previewOrder.customerPhone || previewOrder.phone}
                          </PhoneLink>
                        </InfoSub>
                      )}
                    </InfoText>
                  </InfoLine>
                )}
                {previewOrder.deliveryAddress && (
                  <InfoLine>
                    <InfoIcon>📍</InfoIcon>
                    <InfoText>{previewOrder.deliveryAddress}</InfoText>
                  </InfoLine>
                )}
                {previewOrder.restaurant?.name && (
                  <InfoLine>
                    <InfoIcon>🏪</InfoIcon>
                    <InfoText>{previewOrder.restaurant.name}</InfoText>
                  </InfoLine>
                )}
              </InfoBlock>

              {previewOrder.orderItems?.length > 0 && (
                <ItemsList>
                  {previewOrder.orderItems.map((item) => (
                    <ItemRow key={item.id}>
                      <ItemName>
                        <ItemQty>{item.quantity}×</ItemQty>
                        {item.menuItem?.name || item.name}
                      </ItemName>
                      <ItemPrice>${((item.price ?? item.menuItem?.price ?? 0) * item.quantity).toFixed(2)}</ItemPrice>
                    </ItemRow>
                  ))}
                </ItemsList>
              )}

              {!['done', 'completed', 'cancelled'].includes(previewOrder.status) && (() => {
                const courierIdx = COURIER_STATUS_FLOW.indexOf(previewOrder.courierStatus as CourierStatus);
                const nextStep = COURIER_STATUS_FLOW[courierIdx + 1];
                if (!nextStep) return null;
                return (
                  <MainActionBtn
                    $color={STATUS_CONFIG[nextStep].color}
                    onClick={() => { handleOrderCourierStatus(previewOrder.id, nextStep); closePreview(); }}
                  >
                    ✅ {STATUS_CONFIG[nextStep].label}
                  </MainActionBtn>
                );
              })()}
            </PreviewBody>
          </>
        )}
      </Sheet>
    </Page>
  );
}
