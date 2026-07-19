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
import { useOutsideClick } from '@shared/lib/useOutsideClick';
import {
  useCouriersQuery,
  useOrdersPaginatedQuery,
  useOrderStatusCountsQuery,
  useAssignCourierMutation,
  useUpdateOrderCourierStatusMutation,
  useUpdateOrderStatusMutation,
  useUpdateOrderPayMethodMutation,
  useUpdateOrderTypeMutation,
  useGetMe
} from '@app/hooks/dataApi';
import { toast } from 'react-toastify';
import {courierLocationOptions, getStatusLabelOptions} from "@features/select-courier-status/SelectCourierStatus.ts";
import {formatTime,getDuration} from "@shared/utils/date.ts";
import { useDebounce } from '@shared/utils/useDebounce.ts';
import CourierPage from "@pages/couriers/CourierPage.tsx";
import { OrderRudDrawer } from "./OrderRudDrawer";



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

// localStorage key for the user's persisted orders-table column order.
const COLUMN_ORDER_KEY = 'orders_table_column_order';

// Server-side page size for the orders table.
const PAGE_SIZE = 10;

// Order receipt method (способ получения).
const orderTypeOptions = [
  { value: 'delivery', label: 'Առաքում' },
  { value: 'takeaway', label: 'Տանելու' },
  { value: 'dine_in', label: 'Տեղում' },
];

// localStorage key for the user's hidden (toggled-off) table columns.
const HIDDEN_COLUMNS_KEY = 'orders_table_hidden_columns';

const TableTopBar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
`;
const ColWrap = styled.div`
  position: relative;
`;
const ColPop = styled.div`
  position: absolute;
  z-index: 30;
  top: calc(100% + 6px);
  right: 0;
  width: 260px;
  max-height: 360px;
  overflow: auto;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #141824;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.4);
`;
const ColItem = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.9rem;
  &:hover { background: rgba(255, 255, 255, 0.06); }
  input { cursor: pointer; }
`;

// Dropdown with a checkbox per column to show/hide table fields.
function ColumnsToggle({ columns, hidden, onToggle }: {
  columns: { key: string; name: string }[];
  hidden: string[];
  onToggle: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick<HTMLDivElement>(() => setOpen(false), open);
  const visibleCount = columns.length - hidden.length;
  return (
    <ColWrap ref={ref}>
      <Button type="button" variant="secondary" onClick={() => setOpen((o) => !o)}>
        {/*({visibleCount}/{columns.length})*/}
        ⚙
      </Button>
      {open && (
        <ColPop>
          {columns.map((c) => (
            <ColItem key={c.key}>
              <input type="checkbox" checked={!hidden.includes(c.key)} onChange={() => onToggle(c.key)} />
              <span>{c.name}</span>
            </ColItem>
          ))}
        </ColPop>
      )}
    </ColWrap>
  );
}

const OrdersPage = () => {

  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
  const [isOpenCouriersDialog,setOpenCouriersDialog]=useState('');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [courierTab, setCourierTab] = useState<'free' | 'busy'>('free');
  const [search, setSearch] = useState('');
  const [courierId, setCourierId] = useState('');
  const [activeStatus, setActiveStatus] = useState<(typeof statuses)[number]>('all');
  const [selectedCourier, setSelectedCourier] = useState('all');
  const [selectedOrder,setSelectedOrder] = useState<Order | null>(null);
  const [rudOrder, setRudOrder] = useState<Order | null>(null);
  const [courierDetailsId, setCourierDetailsId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  // ISO instants for the query + filter (the picker returns real Date objects).
  const dateFrom = dateRange.start ? dateRange.start.toISOString() : undefined;
  const dateTo = dateRange.end ? dateRange.end.toISOString() : undefined;
  const debouncedSearch = useDebounce(search, 500);
  const { data: couriersResponse } = useCouriersQuery();

  // Server-side pagination + sorting + filtering: the backend returns only the current
  // page plus meta (total / totalPages). No client-side slicing/sorting anymore.
  const sort = sortColumns[0];
  const ordersQuery = useOrdersPaginatedQuery({
    courierId,
    status: activeStatus,
    search: debouncedSearch,
    dateFrom,
    dateTo,
    page: currentPage,
    limit: PAGE_SIZE,
    sortBy: sort?.columnKey,
    sortOrder: sort?.direction,
  });
  // Per-tab order counts for the toolbar badges (same filters, minus the selected tab).
  const statusCountsQuery = useOrderStatusCountsQuery({
    courierId,
    search: debouncedSearch,
    dateFrom,
    dateTo,
  });
  const statusCounts = statusCountsQuery.data ?? {};

  const orders = ordersQuery.data?.data ?? [];
  const ordersMeta = ordersQuery.data?.meta;
  const totalCount = ordersMeta?.total ?? 0;
  const totalPages = Math.max(1, ordersMeta?.totalPages ?? 1);

  const allCouriers = couriersResponse?.data ?? [];
  // Split the couriers aside into Free / Busy by remaining capacity (available slots).
  const isCourierFull = (c: Courier) => {
    const max = c.maxOrders ?? 0;
    const active = c.activeOrdersCount ?? 0;
    const free = c.availableSlots ?? Math.max(0, max - active);
    return free <= 0;
  };
  const freeCouriers = allCouriers.filter((c) => !isCourierFull(c));
  const busyCouriers = allCouriers.filter((c) => isCourierFull(c));
  const shownCouriers = courierTab === 'free' ? freeCouriers : busyCouriers;
  // Filter couriers by selected restaurant if present
  const courierOptions = allCouriers
    .map((c) => ({ value: (c as any).userId ?? (c as any).id, label: c.user?.name ?? c.user?.email ?? (c as any).name ?? 'Courier' }));
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

  const updateOrderPayMethodMutation = useUpdateOrderPayMethodMutation();

  const handlePaidMethodChange = useCallback(async (id: string, value: PaymentMethod) => {
    try {
      await updateOrderPayMethodMutation.mutateAsync({ id, payMethod: value });
      toast.success('Метод оплаты обновлён');
    } catch {
      toast.error('Ошибка обновления метода оплаты');
    }
  }, [updateOrderPayMethodMutation]);

  const updateOrderTypeMutation = useUpdateOrderTypeMutation();
  const handleOrderTypeChange = useCallback(async (id: string, value: string) => {
    if (!value) return;
    const order = orders.find((o) => o.id === id);
    // Switching an existing non-delivery order TO delivery requires an address — open the
    // edit drawer (preset to delivery) instead of a silent inline change.
    if (value === 'delivery' && order && order.orderType !== 'delivery') {
      setRudOrder({ ...order, orderType: 'delivery' });
      return;
    }
    try {
      await updateOrderTypeMutation.mutateAsync({ id, orderType: value });
      toast.success('Ստացման եղանակը թարմացվեց');
    } catch {
      toast.error('Չհաջողվեց թարմացնել ստացման եղանակը');
    }
  }, [updateOrderTypeMutation, orders]);


  const assignCourierMutation = useAssignCourierMutation();
  const updateOrderCourierStatusMutation = useUpdateOrderCourierStatusMutation();
  const updateOrderStatusMutation = useUpdateOrderStatusMutation();

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

  const baseColumns = useMemo<Column<Order>[]>(
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
          return `${row?.restaurant?.name} ${row?.branch?.address ? `-${row?.branch?.address}` : ''}`;
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
            // Enter "assign mode": pick the courier from the right-hand list (no drawer).
            setSelectedOrder(row);
          }}>Նշանակել առաքիչ</Button>;
        },
      },
      { key: 'orderItems', name: 'Պատվեր', resizable: true, draggable: true,
        renderCell: ({ row }: { row: Order }) => {
          const items = row.orderItems;
          const color = ORDER_STATUS_COLOR[row.status] ?? '#4f8fff';
          return (
            <ItemChips>
              {items.map((item) => (
                <ItemChip key={item?.id} $color={color}>
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
      {
        key: 'orderType',
        name: 'Ստացման եղանակ',
        resizable: true,
        draggable: true,
        width: 160,
        renderCell: ({ row }: { row: Order }) => (
          <Dropdown
            value={row.orderType ?? ''}
            options={orderTypeOptions}
            placeholder="Ստացման եղանակ"
            onChange={(value) => handleOrderTypeChange(row.id, value)}
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
    [handleCourierStatusChange, handleOrderStatusChange, handlePaidMethodChange, handleOrderTypeChange]
  );

  // Persist the user's column order so a drag-reorder survives data/state re-renders.
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(COLUMN_ORDER_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Apply the saved order to the base columns; unknown/new columns are appended.
  const columns = useMemo<Column<Order>[]>(() => {
    if (!columnOrder.length) return baseColumns;
    const byKey = new Map(baseColumns.map((c) => [String(c.key), c]));
    const ordered = columnOrder.map((k) => byKey.get(k)).filter(Boolean) as Column<Order>[];
    const seen = new Set(columnOrder);
    for (const c of baseColumns) if (!seen.has(String(c.key))) ordered.push(c);
    return ordered;
  }, [baseColumns, columnOrder]);

  const handleColumnsReorder = (sourceKey: string, targetKey: string) => {
    const order = columns.map((c) => String(c.key));
    const si = order.indexOf(sourceKey);
    const ti = order.indexOf(targetKey);
    if (si === -1 || ti === -1) return;
    const next = [...order];
    const [moved] = next.splice(si, 1);
    next.splice(ti, 0, moved);
    setColumnOrder(next);
    try {
      localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(next));
    } catch {
      /* ignore storage errors */
    }
  };

  // Column visibility (persisted): list of hidden column keys toggled via the checkbox menu.
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(HIDDEN_COLUMNS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const toggleColumn = (key: string) => {
    setHiddenColumns((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try {
        localStorage.setItem(HIDDEN_COLUMNS_KEY, JSON.stringify(next));
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  };

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenColumns.includes(String(c.key))),
    [columns, hiddenColumns],
  );

  // Label list for the checkbox menu (key + readable name).
  const columnToggleList = useMemo(
    () => columns.map((c) => ({ key: String(c.key), name: typeof c.name === 'string' ? c.name : String(c.key) })),
    [columns],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [search, activeStatus, selectedCourier, courierId, dateFrom, dateTo, sortColumns]);


  return (
    <div>
      <ContentRow>
        <MainCol>
      <Header>
        <div>
          <Title>Պատվերներ</Title>
        </div>
        <CreateInlineBtn type="button" onClick={() => { setEditOrder(null); setCreateOpen(true); }}>
          Ստեղծել պատվեր
        </CreateInlineBtn>
      </Header>
      <Toolbar>
        <Controls>
          <div style={{ gridColumn: '1 / -1' }}>
            <Label>Որոնել</Label>
            <SearchInputWrap>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Որոնում։ Ռեստորան կամ առաքիչ"/>

            </SearchInputWrap>
          </div>
        </Controls>
        <ControlsRow>
          <span style={{ color: 'rgba(255,255,255,0.72)' }}> գտնվել է {totalCount} պատվեր  </span>
        </ControlsRow>
      </Toolbar>

      <StatusTabs>
        {statuses.map((status) => (
          <StatusTab
            key={status}
            active={activeStatus === status}
            $color={ORDER_STATUS_COLOR[status] ?? '#4f8fff'}
            type="button"
            onClick={() => setActiveStatus(status)}
          >
            {statusLabels[status]}
            {typeof statusCounts[status] === 'number' && (
              <TabCount active={activeStatus === status}>{statusCounts[status]}</TabCount>
            )}
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
        <TableTopBar>
          <ColumnsToggle columns={columnToggleList} hidden={hiddenColumns} onToggle={toggleColumn} />
        </TableTopBar>
      </StatusTabs>

        <TableSection style={{ flex: 1, minWidth: 0 }}>

          <Table<Order> rows={orders} columns={visibleColumns} className={'orders-table'} sortColumns={sortColumns} onSortColumnsChange={setSortColumns} onColumnsReorder={handleColumnsReorder} onRowDoubleClick={(row) => setRudOrder(row)} />
          <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
        </TableSection>
        </MainCol>

        <CouriersAside>
          <AsideTitle>Առաքիչներ ({allCouriers.length})</AsideTitle>
          {selectedOrder && (
            <AssignBanner>
              <span>Ընտրեք առաքիչ՝ <b>#{selectedOrder.code}</b></span>
              <button type="button" onClick={() => setSelectedOrder(null)} title="Չեղարկել">✕</button>
            </AssignBanner>
          )}
          <CourierTabs>
            <CourierTab type="button" $active={courierTab === 'free'} onClick={() => setCourierTab('free')}>
              Ազատ <b>{freeCouriers.length}</b>
            </CourierTab>
            <CourierTab type="button" $active={courierTab === 'busy'} onClick={() => setCourierTab('busy')}>
              Լրացված <b>{busyCouriers.length}</b>
            </CourierTab>
          </CourierTabs>
          <CourierList>
          {shownCouriers.length === 0 && <AsideEmpty>Առաքիչներ չկան</AsideEmpty>}
          {shownCouriers.map((courier) => {
            const cid = (courier as any).userId ?? courier.id;
            const max = courier.maxOrders ?? 0;
            const active = courier.activeOrdersCount ?? 0;
            const free = courier.availableSlots ?? Math.max(0, max - active);
            const full = free <= 0;
            const pct = max > 0 ? Math.min(100, Math.round((active / max) * 100)) : 0;
            const color = STATUS_COLOR[courier.status] ?? '#64748b';
            return (
              <CourierCard
                key={cid}
                type="button"
                $assign={!!selectedOrder}
                onClick={() =>
                  selectedOrder
                    ? handleCourierAsignToOrder(String(cid)) // assign mode → assign to the picked order
                    : setCourierDetailsId(String(cid))       // normal → open courier details
                }
              >
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
                  {courier.lastDelivery?.address && (
                    <LastDelivery $current={!!courier.lastDelivery.current} title={courier.lastDelivery.address}>
                      {courier.lastDelivery.current ? '📍 ' : '🏁 '}{courier.lastDelivery.address}
                      {courier.lastDelivery.at ? ` · ${new Date(courier.lastDelivery.at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}
                    </LastDelivery>
                  )}
                </CourierMeta>
              </CourierCard>
            );
          })}
          </CourierList>
        </CouriersAside>
      </ContentRow>

      <Drawer open={isCreateOpen} position="bottom" title={editOrder ? `Փոխել պատվերը #${editOrder.code}` : 'Ստեղծել նոր պատվեր'} onClose={() => { setCreateOpen(false); setEditOrder(null); }}>
        <CreateOrderFlow key={editOrder?.id ?? 'new'} order={editOrder} onClose={()=>{ setCreateOpen(false); setEditOrder(null); }}/>
      </Drawer>
      <Drawer openWidth={'600px'} open={Boolean(courierDetailsId)} position="right" title="Առաքիչ" onClose={() => setCourierDetailsId(null)}>
        {courierDetailsId && <CourierPage id={courierDetailsId} onClose={() => setCourierDetailsId(null)} />}
      </Drawer>
      <Drawer open={Boolean(rudOrder)} position="right" title={rudOrder ? `Պատվեր #${rudOrder.code}` : 'Պատվեր'} onClose={() => setRudOrder(null)}>
        {rudOrder && <OrderRudDrawer order={rudOrder} onClose={() => setRudOrder(null)} onEdit={(o) => { setRudOrder(null); setEditOrder(o); setCreateOpen(true); }} />}
      </Drawer>
    </div>
  );
};
export default OrdersPage


const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
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

const StatusTab = styled.button<{ active?: boolean; $color?: string }>`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 1px solid ${({ active, $color }) => (active ? 'transparent' : `${$color || '#4f8fff'}3d`)};
    border-radius: 999px;
    padding: 10px 18px;
    background: ${({ active, $color }) => (active ? ($color || '#4f8fff') : `${$color || '#4f8fff'}1f`)};
    color: ${({ active }) => (active ? '#fff' : 'rgba(255, 255, 255, 0.85)')};
    font-weight: 700;
    cursor: pointer;
    transition: background 150ms ease, border-color 150ms ease;

    &:hover {
        background: ${({ active, $color }) => (active ? ($color || '#4f8fff') : `${$color || '#4f8fff'}33`)};
    }
`;

const TabCount = styled.span<{ active?: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 800;
    line-height: 1;
    background: ${({ active }) => (active ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.12)')};
    color: ${({ active }) => (active ? '#fff' : 'rgba(255, 255, 255, 0.9)')};
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

// Left column holds everything (title, search, tabs, table); the couriers aside is the
// full-height right column beside it.
const MainCol = styled.div`
    flex: 1;
    min-width: 0;
`;

// Wraps the search input so the "create order" button can float at its right end.
const SearchInputWrap = styled.div`
    position: relative;
    input { padding-right: 180px; }
`;
const CreateInlineBtn = styled.button`
    border: none;
    border-radius: 32px;
    cursor: pointer;
    padding: 10px 18px;
    font-weight: 700;
    font-size: 0.9rem;
    color: #fff;
    background: linear-gradient(135deg, #5d7bff, #34d399);
    white-space: nowrap;
    &:hover { opacity: 0.95; }
`;

const CouriersAside = styled.aside`
    width: 320px;
    flex-shrink: 0;
    position: sticky;
    /* Full-height right column: fills the viewport, header/tabs pinned, cards scroll. */
    height: calc(100vh - 85px);
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 14px;
    box-sizing: border-box;
    overflow: hidden;
    @media (max-width: 1200px) { display: none; }
`;

const CourierList = styled.div`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: grid;
    gap: 10px;
    align-content: start;
    padding-right: 2px;
`;

const AsideTitle = styled.h3`
    margin: 0 0 10px;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.78);
`;

const CourierTabs = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
`;
const CourierTab = styled.button<{ $active?: boolean }>`
    flex: 1;
    padding: 7px 10px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 600;
    color: ${({ $active }) => ($active ? '#fff' : 'rgba(255,255,255,0.7)')};
    border: 1px solid ${({ $active }) => ($active ? 'rgba(79,143,255,0.7)' : 'rgba(255,255,255,0.12)')};
    background: ${({ $active }) => ($active ? 'rgba(79,143,255,0.18)' : 'rgba(255,255,255,0.04)')};
    b { opacity: 0.85; }
`;

const CourierCard = styled.button<{ $assign?: boolean }>`
    display: grid;
    gap: 8px;
    text-align: left;
    width: 100%;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid ${({ $assign }) => ($assign ? 'rgba(52,211,153,0.5)' : 'rgba(255, 255, 255, 0.08)')};
    background: ${({ $assign }) => ($assign ? 'rgba(52,211,153,0.08)' : 'rgba(255, 255, 255, 0.04)')};
    color: #fff;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
    &:hover { background: ${({ $assign }) => ($assign ? 'rgba(52,211,153,0.16)' : 'rgba(255, 255, 255, 0.07)')}; border-color: ${({ $assign }) => ($assign ? 'rgba(52,211,153,0.8)' : 'rgba(255, 255, 255, 0.16)')}; }
`;

const AssignBanner = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
    padding: 8px 12px;
    border-radius: 10px;
    background: rgba(52, 211, 153, 0.14);
    border: 1px solid rgba(52, 211, 153, 0.4);
    color: #34d399;
    font-size: 0.85rem;
    b { color: #fff; }
    button { border: none; background: transparent; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 15px; }
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

const LastDelivery = styled.div<{ $current?: boolean }>`
    margin-top: 2px;
    color: ${({ $current }) => ($current ? 'rgba(79, 143, 255, 0.95)' : 'rgba(52, 211, 153, 0.85)')};
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
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

// Order-status palette for the item chips (8-digit hex = base color + alpha for the
// translucent fill/border). Falls back to the original blue for unknown statuses.
const ORDER_STATUS_COLOR: Record<string, string> = {
  new: '#9ca3ff', pending: '#9ca3ff', accepted: '#38bdf8', cooking: '#f59e0b',
  ready: '#38bdf8', delivering: '#9d7cff', enRoute: '#9d7cff',
  done: '#34d399', completed: '#34d399', cancelled: '#ef4444',
};

const ItemChip = styled.span<{ $color?: string }>`
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 4px 10px;
    border-radius: 999px;
    background: ${({ $color }) => `${$color || '#4f8fff'}1f`};
    border: 1px solid ${({ $color }) => `${$color || '#4f8fff'}3d`};
    color: rgba(255, 255, 255, 0.92);
    font-size: 0.85rem;
    line-height: 1.2;
    white-space: nowrap;
`;