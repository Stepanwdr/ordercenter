import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Dropdown } from '@shared/ui/Dropdown';
import {CreateOrderFlow} from '@features/create-order/CreateOrderFlow.tsx';
import { Table } from '@shared/ux/Table';
import type {Column, SortColumn} from 'react-data-grid';
import type {Courier, CourierStatus, Order, OrderStatus} from '@shared/types';
import { Drawer } from '@shared/ux/Drawer';
import { Pagination } from '@shared/ux/Pagination.tsx';
import { DateRangePicker, type DateRange } from '@shared/ui/DateRangePicker';
import {
  useCouriersQuery,
  useOrdersQuery,
  useAssignCourierMutation,
  useUpdateOrderCourierStatusMutation,
  useUpdateOrderStatusMutation,
  useUpdateOrderPayMethodMutation,
  useGetMe
} from '@app/hooks/dataApi';
import { toast } from 'react-toastify';
import {courierLocationOptions, getStatusLabelOptions} from "@features/select-courier-status/SelectCourierStatus.ts";
import {formatTime,getDuration} from "@shared/utils/date.ts";
import { useDebounce } from '@shared/utils/useDebounce.ts';
import CouriersPage from "@pages/couriers/CouriersPage.tsx";
import CourierPage from "@pages/couriers/CourierPage.tsx";

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 24px;
`;

const Title = styled.h3`
    margin: 0;
`;

const Toolbar = styled.div`
    display: grid;
    gap: 18px;
    margin-bottom: 20px;
`;

const Controls = styled.div`
    display: grid;
    grid-template-columns: minmax(320px, 1fr) minmax(240px, 320px);
    gap: 16px;
    align-items: center;
`;
const Label = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
`;
const StatusTabs = styled.div`
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
`;

const StatusTab = styled.button<{ active?: boolean }>`
    border: none;
    border-radius: 999px;
    padding: 10px 18px;
    background: ${({ active }) => (active ? 'rgba(79, 143, 255, 0.95)' : 'rgba(255, 255, 255, 0.06)')};
    color: ${({ active }) => (active ? '#fff' : 'rgba(255, 255, 255, 0.78)')};
    font-weight: 700;
    cursor: pointer;
    transition: background 150ms ease;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }
`;

const ControlsRow = styled.div`
    display: flex;
    gap: 14px;
    align-items: center;
`;

const TableSection = styled.section`
    margin-top: 20px;
    min-width: 0;
    overflow-x: auto;
    padding-bottom: 8px;
    .orders-table {
      .data-grid{
         height: calc(100vh - 423px)
        }
    }
  
`;

const ContentRow = styled.div`
    display: flex;
    gap: 16px;
    align-items: flex-start;
`;

const CouriersAside = styled.aside`
    width: 320px;
    flex-shrink: 0;
    margin-top: 20px;
    position: sticky;
    top: 16px;
    max-height: calc(100vh - 140px);
    overflow-y: auto;
    display: grid;
    gap: 10px;
    align-content: start;
    @media (max-width: 1200px) { display: none; }
`;

const AsideTitle = styled.h3`
    margin: 0 0 4px;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.78);
`;

const CourierCard = styled.button`
    display: grid;
    gap: 8px;
    text-align: left;
    width: 100%;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: #fff;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
    &:hover { background: rgba(255, 255, 255, 0.07); border-color: rgba(255, 255, 255, 0.16); }
`;

const CourierTop = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
`;

const CourierName = styled.span`
    font-weight: 700;
    font-size: 0.95rem;
`;

const StatusChip = styled.span<{ $color: string }>`
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    color: ${({ $color }) => $color};
    background: ${({ $color }) => `${$color}22`};
    border: 1px solid ${({ $color }) => `${$color}44`};
    white-space: nowrap;
`;

const CourierMeta = styled.div`
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.55);
    line-height: 1.5;
`;

const LoadRow = styled.div`
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    font-size: 0.8rem;
`;

const LoadFree = styled.span<{ $full: boolean }>`
    font-weight: 600;
    color: ${({ $full }) => ($full ? '#ef4444' : '#34d399')};
`;

const LoadTrack = styled.div`
    height: 6px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;
`;

const LoadFill = styled.div<{ $pct: number; $full: boolean }>`
    height: 100%;
    width: ${({ $pct }) => $pct}%;
    background: ${({ $full }) => ($full ? '#ef4444' : '#34d399')};
    transition: width 0.2s ease;
`;

const AsideEmpty = styled.div`
    padding: 16px;
    text-align: center;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.4);
`;

const STATUS_COLOR: Record<string, string> = {
  free: '#34d399',
  busy: '#f59e0b',
  offline: '#ef4444',
  dayOff: '#8b5cf6',
  atRestaurant: '#4f8fff',
  pickedUp: '#8b5cf6',
  enRoute: '#f59e0b',
  delivered: '#34d399',
};

const ItemChips = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px 0;
`;

const ItemChip = styled.span`
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(79, 143, 255, 0.12);
    border: 1px solid rgba(79, 143, 255, 0.24);
    color: rgba(255, 255, 255, 0.92);
    font-size: 0.85rem;
    line-height: 1.2;
    white-space: nowrap;
`;

const statuses = ['all', 'new', 'cooking', 'ready', 'delivering', 'done'] as const;

const statusLabels: Record<(typeof statuses)[number], string> = {
  all: 'Բոլորը',
  new: 'Նոր',
  cooking: 'Պատրաստվում է',
  ready: 'Պատրաստ',
  delivering: 'Ճանապարհին է',
  done: 'Ավարտված',
};

const paymentMethods = ['CASH', 'ONLINE', 'BANK-POS', 'IDRAM'] as const;
type PaymentMethod = (typeof paymentMethods)[number];

const paymentOptions = paymentMethods.map((method) => ({ value: method, label: method }));



const orderStatusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'cooking', label: 'Պատրաստվում է' },
  { value: 'ready', label: 'Պատրաստ է' },
  { value: 'enRoute', label: 'Ճանապարհին է' },
  { value: 'done', label: 'Ավարտված' },
];

const OrdersPage = () => {

  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
  const [isOpenCouriersDialog,setOpenCouriersDialog]=useState('');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [courierId, setCourierId] = useState('');
  const [activeStatus, setActiveStatus] = useState<(typeof statuses)[number]>('all');
  const [selectedCourier, setSelectedCourier] = useState('all');
  const [selectedOrder,setSelectedOrder] = useState<Order | null>(null);
  const [courierDetailsId, setCourierDetailsId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  // ISO instants for the query + filter (the picker returns real Date objects).
  const dateFrom = dateRange.start ? dateRange.start.toISOString() : undefined;
  const dateTo = dateRange.end ? dateRange.end.toISOString() : undefined;
  const debouncedSearch = useDebounce(search, 500);
  const { data: couriersResponse } = useCouriersQuery();
  const { data: apiOrders } = useOrdersQuery({courierId,status: activeStatus, search: debouncedSearch, dateFrom, dateTo, limit: 1000});

  const allCouriers = couriersResponse?.data ?? [];
  // Filter couriers by selected restaurant if present
  const courierOptions = allCouriers
    .map((c) => ({ value: (c as any).userId ?? (c as any).id, label: c.user?.name ?? c.user?.email ?? (c as any).name ?? 'Courier' }));
  const pageSize = 10;
  const orders= apiOrders &&  apiOrders?.length ? apiOrders : [];
  // const couriers = useMemo(
  //   () => [
  //     { value: 'all', label: 'Առաքիչների ցանկ' },
  //     ...Array.from(new Set((orders).map((order) => order.courier).filter(Boolean))).map((courier) => ({
  //       value: courier as string,
  //       label: courier as string,
  //     })),
  //   ],
  //   [orders]
  // );
  const couriers = [] as Courier[];

  // Calendar range filter on createdAt (client-side, inclusive). The picker already
  // carries exact instants (start/end Date with their times), so compare directly.
  const dateFilteredOrders = useMemo(() => {
    const { start, end } = dateRange;
    if (!start && !end) return orders;
    const fromMs = start ? start.getTime() : -Infinity;
    const toMs = end ? end.getTime() : Infinity;
    return orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= fromMs && t <= toMs;
    });
  }, [orders, dateRange]);

  const sortedOrders = useMemo(() => {
    if (sortColumns.length === 0) return dateFilteredOrders;

    const { columnKey, direction } = sortColumns[0];

    return [...dateFilteredOrders].sort((a: any, b: any) => {
      const aValue = a[columnKey];
      const bValue = b[columnKey];

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (aValue < bValue) {
        return direction === 'ASC' ? -1 : 1;
      }

      if (aValue > bValue) {
        return direction === 'ASC' ? 1 : -1;
      }

      return 0;
    });
  }, [dateFilteredOrders, sortColumns]);
  const updateOrderPayMethodMutation = useUpdateOrderPayMethodMutation();

  const handlePaidMethodChange = useCallback(async (id: string, value: PaymentMethod) => {
    try {
      await updateOrderPayMethodMutation.mutateAsync({ id, payMethod: value });
      toast.success('Метод оплаты обновлён');
    } catch {
      toast.error('Ошибка обновления метода оплаты');
    }
  }, [updateOrderPayMethodMutation]);


  const assignCourierMutation = useAssignCourierMutation();
  const updateOrderCourierStatusMutation = useUpdateOrderCourierStatusMutation();
  const updateOrderStatusMutation = useUpdateOrderStatusMutation();
  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedOrders.slice(start, start + pageSize);
  }, [currentPage, sortedOrders]);

  const handleOrderStatusChange = useCallback(
    async (id: string, value: OrderStatus) => {
      await updateOrderStatusMutation.mutateAsync({
        id,
        status: value
      });
    },
    [updateOrderStatusMutation]
  );

  const handleCourierStatusChange = useCallback(async (orderId: string, courierStatus: CourierStatus) => {
    try {
      await updateOrderCourierStatusMutation.mutateAsync({ orderId, courierStatus });
      toast.success('Статус курьера для заказа обновлён');
    } catch {
      toast.error('Ошибка обновления статуса');
    }
  }, [updateOrderCourierStatusMutation]);

  const handleCourierAsignToOrder = async (courierId: string) => {
    if (!selectedOrder) return;
    try {
      await assignCourierMutation.mutateAsync({ id: selectedOrder.id, courierId });
      toast.success('Առաքիչը հաջողությամբ նշանակվեց');
      // close couriers dialog / drawer
      setSelectedOrder(null);
      setOpenCouriersDialog('');
    } catch (err: any) {
      toast.error(err?.message || 'Անհաջող հանձնարարություն');
    }
  };

  const columns = useMemo<Column<Order>[]>(
    () => [
      { key: 'code', name: 'Կոդ', resizable: true, draggable: true,  sortable: true},
      { key: 'orderDuration',  sortable: true, name: 'Պատվերի տևողությունը', resizable: true, draggable: true,renderCell:({row})=> <Button style={{minHeight:"30px",width:"100%"}}>{getDuration(row.createdAt,row.completedAt)}</Button> },
      { key: 'customerName', name: 'Հաճախորդ',  sortable: true, resizable: true, draggable: true },
      { key: 'customerPhone', name: 'Հաճախորդի հեռ․',  sortable: true, resizable: true, draggable: true },
      { key: 'completedAt', name: 'Պատվերն ավարտվել է',  sortable: true, resizable: true, draggable: true ,
        renderCell:({ row }: { row: Order })=>formatTime(row.completedAt)},
      { key: 'orderTime', name: 'Գրանցման ամսաթիվը',  sortable: true, resizable: true, draggable: true,
        renderCell: ({ row }: { row: Order }) => {
          return formatTime(row.createdAt)
        }, },
      { key: 'prepTime', name: 'Տրման Ժամը', resizable: true, draggable: true,  sortable: true,
        renderCell: ({ row }: { row: Order }) => {
          return row?.prepTime || 'Անմիջապես';
        },
      },
      { key: 'restaurant', name: 'Ռեստորան', resizable: true, draggable: true,  sortable: true,
        renderCell: ({ row }: { row: Order }) => {
          return row?.restaurant?.name;
        },
      },
      { key: 'branch', name: 'Մասնաճյուղ', resizable: true, draggable: true,
        renderCell: ({ row }: { row: Order }) => row?.branch?.name || row?.branch?.address || '—',
      },
      { key: 'courierRestaurantAt',  sortable: true, name: 'Առաքիչը հասել է ռեստորան', resizable: true, draggable: true,renderCell:({row})=>formatTime(row.courierRestaurantAt) },
      { key: 'courierDeliveredAt',   sortable: true,name: 'Առաքիչը առաքումը ավարտել է', resizable: true, draggable: true,renderCell:({row})=>formatTime(row.courierDeliveredAt) },
      { key: 'courierPickedUpAt',   sortable: true,name: 'Առաքիչը պատվերը վերցրել է', resizable: true, draggable: true,renderCell:({row})=>formatTime(row.courierPickedUpAt) },
      { key: 'courierInRouteAt',   sortable: true,name: 'Առաքիչը ճանապարհին է եղել', resizable: true, draggable: true,renderCell:({row})=>formatTime(row.courierInRouteAt) },
      { key: 'courier', name: 'Առաքիչ', resizable: true, draggable: true,
        renderCell: ({ row }: { row: Order }) => {
          return row?.courierProfile?.user?.name ?? <Button style={{minHeight:"25px"}} variant={'primary'} onClick={()=>{
            setSelectedOrder(row);
            setOpenCouriersDialog(row.id);
          }}>Նշանակել առաքիչ</Button>;
        },
      },
      { key: 'orderItems', name: 'Պատվեր', resizable: true, draggable: true,
        renderCell: ({ row }: { row: Order }) => {
          const items = row.orderItems;
          return (
            <ItemChips>
              {items.map((item) => (
                <ItemChip key={item?.id}>
                  {item?.quantity}h - {item?.menuItem?.name}
                </ItemChip>
              ))}
            </ItemChips>
          )
        },},
      {
        key: 'payMethod',
        name: 'Վճարման եղանակը',
        resizable: true,
        draggable: true,
        width: 180,
        renderCell: ({ row }: { row: Order }) => (
          <Dropdown
            value={row.payMethod}
            options={paymentOptions}
            placeholder="Վճարման եղանակը"
            onChange={(value) => handlePaidMethodChange(row.id, value as PaymentMethod)}
            asTableCell
            triggerDisplay="chip"
          />
        ),
      },
      { key: 'courierPhone', name: 'Առաքիչի հեռ․', resizable: true, draggable: true,
        renderCell: ({ row }: { row: Order }) => {
          return row?.courierProfile?.user?.phone;
        }, },
      {
        key: 'orderAddress',
        name: 'Պատվերի հասցե',
        resizable: true,
        draggable: true,
        renderCell: ({ row }: { row: Order }) => {
          return `${row.deliveryAddress}  ${row.addressComment || ''}`;
        },
      },
      {
        key: 'courierStatus',
        name: 'Առաքիչի կարգավիճակը',
        resizable: true,
        draggable: true,
        renderCell: ({ row }: { row: Order }) => (
          <Dropdown
            value={row?.courierStatus || ''}
            options={courierLocationOptions}
            placeholder="Առաքիչի կարգավիճակը"
            onChange={(value) => handleCourierStatusChange(row.id, value as CourierStatus)}
            asTableCell
            triggerDisplay="chip"
            trigerDisabled={Boolean(!row.courierProfile)}
          />
        ),
      },
      { key: 'operatorName', name: 'Օպերատոր', resizable: true, draggable: true, renderCell: ({ row }: { row: Order }) => row.operator.name },
      { key: 'status', name: 'Պատվերի կարգավիճակ', resizable: true, draggable: true ,
        renderCell: ({ row }: { row: Order }) => (
          <Dropdown
            value={row?.status || 'new'}
            options={orderStatusOptions}
            placeholder="Պատվերի կարգավիճակը"
            onChange={(value) => handleOrderStatusChange(row.id, value as OrderStatus)}
            asTableCell
            triggerDisplay="chip"
          />
        ),},
      { key: 'deliveryFee', name: 'Առաքման գումար', resizable: true, draggable: true, sortable: true,
        renderCell: ({ row }: { row: Order }) => `${Number(row.deliveryFee ?? 0).toFixed(2)}`,
      },
      { key: 'price', name: 'Գումարը', resizable: true, draggable: true,  sortable: true },
    ],
    [handleCourierStatusChange, handleOrderStatusChange, handlePaidMethodChange]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [search, activeStatus, selectedCourier, dateFrom, dateTo]);


  return (
    <div>
      <Header>
        <div>
          <Title>Պատվերներ</Title>
        </div>
        <Button onClick={() => setCreateOpen(true)} variant="primary">
          Ստեղծել պատվեր
        </Button>
      </Header>
      <Toolbar>
        <Controls>
          <div>
            <Label>Որոնել</Label>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Որոնում։ Ռեստորան կամ առաքիչ"/>
          </div>

        </Controls>
        <ControlsRow>
          <span style={{ color: 'rgba(255,255,255,0.72)' }}> գտնվել է {sortedOrders.length} պատվեր  </span>
        </ControlsRow>
      </Toolbar>

      <StatusTabs>
        {statuses.map((status) => (
          <StatusTab
            key={status}
            active={activeStatus === status}
            type="button"
            onClick={() => setActiveStatus(status)}
          >
            {statusLabels[status]}
          </StatusTab>
        ))}
        <ControlsRow>
          <Dropdown  value={courierId} options={courierOptions} placeholder="Ընտրել առաքիչ" onChange={setCourierId} />
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            locale="hy-AM"
            labels={{ placeholder: 'Ընտրեք ամսաթիվ', clear: 'Մաքրել', apply: 'Կիրառել' }}
          />
        </ControlsRow>
      </StatusTabs>

      <ContentRow>
        <TableSection style={{ flex: 1, minWidth: 0 }}>
          <Table<Order> rows={pageRows} columns={columns} className={'orders-table'} sortColumns={sortColumns} onSortColumnsChange={setSortColumns} />
          <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
        </TableSection>

        <CouriersAside>
          <AsideTitle>Առաքիչներ ({allCouriers.length})</AsideTitle>
          {allCouriers.length === 0 && <AsideEmpty>Առաքիչներ չկան</AsideEmpty>}
          {allCouriers.map((courier) => {
            const cid = (courier as any).userId ?? courier.id;
            const max = courier.maxOrders ?? 0;
            const active = courier.activeOrdersCount ?? 0;
            const free = courier.availableSlots ?? Math.max(0, max - active);
            const full = free <= 0;
            const pct = max > 0 ? Math.min(100, Math.round((active / max) * 100)) : 0;
            const color = STATUS_COLOR[courier.status] ?? '#64748b';
            return (
              <CourierCard key={cid} type="button" onClick={() => setCourierDetailsId(String(cid))}>
                <CourierTop>
                  <CourierName>{courier.user?.name || courier.user?.email || 'Առաքիչ'}</CourierName>
                  <StatusChip $color={color}>{getStatusLabelOptions[courier.status] ?? courier.status}</StatusChip>
                </CourierTop>
                <LoadRow>
                  <span>Բեռնվածություն՝ <b>{active} / {max}</b></span>
                  <LoadFree $full={full}>{full ? 'Լրացված' : `Ազատ՝ ${free}`}</LoadFree>
                </LoadRow>
                <LoadTrack><LoadFill $pct={pct} $full={full} /></LoadTrack>
                <CourierMeta>
                  {courier.user?.phone && <div>📞 {courier.user.phone}</div>}
                  {courier.restaurant?.name && <div>🏪 {courier.restaurant.name}</div>}
                </CourierMeta>
              </CourierCard>
            );
          })}
        </CouriersAside>
      </ContentRow>

      <Drawer open={isCreateOpen} position="bottom" title="Ստեղծել նոր պատվեր" onClose={() => setCreateOpen(false)}>
        <CreateOrderFlow onClose={()=>setCreateOpen(false)}/>
      </Drawer>
      <Drawer open={Boolean(selectedOrder)} position="bottom" title="Առաքիչների ցանկ" onClose={() => setSelectedOrder(null)}>
        <CouriersPage selectedOrder={selectedOrder} handleCourierAsignToOrder={handleCourierAsignToOrder} />
      </Drawer>
      <Drawer open={Boolean(courierDetailsId)} position="right" title="Առաքիչ" onClose={() => setCourierDetailsId(null)}>
        {courierDetailsId && <CourierPage id={courierDetailsId} onClose={() => setCourierDetailsId(null)} />}
      </Drawer>
    </div>
  );
};
export default OrdersPage
