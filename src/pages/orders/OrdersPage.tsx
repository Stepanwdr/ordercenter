import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Dropdown } from '@shared/ui/Dropdown';
import { CreateOrderForm } from '@features/create-order/CreateOrderForm';
import { Table } from '@shared/ux/Table';
import type { Column } from 'react-data-grid';
import type {CourierStatus, Order, OrderStatus} from '@shared/types';
import { Drawer } from '@shared/ux/Drawer';
import { Pagination } from '@shared/ux/Pagination.tsx';
import { useOrdersQuery } from '@app/hooks/dataApi';

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
  flex-wrap: wrap;
`;

const TableSection = styled.section`
  margin-top: 20px;
  min-width: 0;
  overflow-x: auto;
  padding-bottom: 8px;
`;

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

const mockOrders: Order[] = [
  {
    id: 'o1',
    paid:false,
    orderCode: 'ORD-1001',
    customerName: 'Արմինե Սիմոնյան',
    phone: '+1 415 555 0101',
    restaurant: 'Pandok',
    courier: 'Nova Kai',
    paidMethod: 'CASH',
    totalAmount: 32.75,
    status: 'cooking',
    createdAt: '2026-04-17T10:22:00Z',
    orderItems: [
      { id: 'i1', name: 'Spicy ramen', quantity: 1, price: 14.5 },
      { id: 'i2', name: 'Green tea', quantity: 2, price: 4.0 },
    ],
    courierPhone: '+374 988545454',
    operatorName: 'Diana Rose',
    orderTime: '10:22',
    prepTime: '13։00',
    courierStatus: 'pickedUp',
    customerPhone:"+374 981545454",
    address: {
      city: 'San Francisco',
      street: 'Market St',
      building: '815',
      apartment: '7B',
      comment: 'Leave at reception',
    },
  },
  {
    id: 'o2',
    paid:false,
    orderCode: 'ORD-1002',
    customerName: 'Marcus Flynn',
    phone: '+1 415 555 0202',
    restaurant: 'Taco Vault',
    courier: 'Maya Ortiz',
    totalAmount: 18.0,
    status: 'ready',
    createdAt: '2026-04-17T11:05:00Z',
    orderItems: [{ id: 'i3', name: 'Shaurma', quantity: 2, price: 1000 }],
    courierPhone: '+1 415 555 0266',
    operatorName: 'Miles Chen',
    paidMethod: 'ONLINE',
    orderTime: '11:05',
    prepTime: '12։00',
    courierStatus: 'atRestaurant',
    customerPhone:"+374 981545454",
    address: {
      city: 'Oakland',
      street: '12th Ave',
      building: '94',
      apartment: '2A',
    },
  },
  {
    id: 'o3',
    paid:false,
    orderCode: 'ORD-1003',
    customerName: 'Sara Lim',
    phone: '+1 415 555 0303',
    restaurant: 'Sunset Pizzeria',
    courier: 'Jin Park',
    totalAmount: 26.5,
    status: 'cooking',
    createdAt: '2026-04-17T11:30:00Z',
    orderItems: [
      { id: 'i4', name: 'Margherita pizza', quantity: 1, price: 12.5 },
      { id: 'i5', name: 'Caesar salad', quantity: 1, price: 7.5 },
      { id: 'i6', name: 'Chocolate soda', quantity: 1, price: 6.5 },
    ],
    courierPhone: '+1 415 555 0455',
    operatorName: 'Nina Patel',
    paidMethod: 'BANK POS',
    orderTime: '11:30',
    prepTime: '11:30',
    courierStatus: 'enRoute',
    customerPhone:"+374 981545454",
    address: {
      city: 'San Francisco',
      street: 'Valencia St',
      building: '123',
      apartment: '5C',
      comment: 'Ring the bell twice',
    },
  },
];

const statuses = ['all', 'new', 'cooking', 'ready', 'delivering', 'done'] as const;

const statusLabels: Record<(typeof statuses)[number], string> = {
  all: 'Բոլորը',
  new: 'Նոր',
  cooking: 'Պատրաստվում է',
  ready: 'Պատրաստ',
  delivering: 'Ճանապարհին է',
  done: 'Ավարտված',
};

const paymentMethods = ['CASH', 'ONLINE', 'BANK POS', 'IDRAM'] as const;
type PaymentMethod = (typeof paymentMethods)[number];
type CourierLocationStatus = CourierStatus;

const paymentOptions = paymentMethods.map((method) => ({ value: method, label: method }));

const courierLocationOptions: { value: CourierLocationStatus; label: string }[] = [
  { value: 'atRestaurant', label: 'Ռեստորանում է' },
  { value: 'pickedUp', label: 'Պատվերը վերցրել է ' },
  { value: 'enRoute', label: 'Ճանապարհին է' },
  { value: 'delivered', label: 'Հասել է' },
];

const orderStatusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'cooking', label: 'Պատրաստվում է' },
  { value: 'ready', label: 'Պատրաստ է' },
  { value: 'enRoute', label: 'Ճանապարհին է' },
  { value: 'done', label: 'Ավարտված' },
];

export const OrdersPage = () => {
  const { data: apiOrders } = useOrdersQuery();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<(typeof statuses)[number]>('all');
  const [selectedCourier, setSelectedCourier] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [orderData, setOrderData] = useState<Order[]>(mockOrders);
  const pageSize = 4;
  const orders=apiOrders && apiOrders.length ? apiOrders : orderData;
  const couriers = useMemo(
    () => [
      { value: 'all', label: 'Առաքիչների ցանկ' },
      ...Array.from(new Set((orders).map((order) => order.courier).filter(Boolean))).map((courier) => ({
        value: courier as string,
        label: courier as string,
      })),
    ],
    [orders]
  );

  const handlePaidMethodChange = useCallback((id: string, value: PaymentMethod) => {
    setOrderData((prev) => prev.map((order) => (order.id === id ? { ...order, paidMethod: value } : order)));
  }, []);

  const handleCourierStatusChange = useCallback((id: string, value: CourierLocationStatus) => {
    setOrderData((prev) => prev.map((order) => (order.id === id ? { ...order, courierStatus: value } : order)));
  }, []);

  const handleOrderStatusChange = useCallback((id: string, value: OrderStatus) => {
    setOrderData((prev) => prev.map((order) => (order.id === id ? { ...order, status: value } : order)));
  }, []);

  const columns = useMemo<Column<Order>[]>(
    () => [
      { key: 'id', name: 'Կոդ', resizable: true, draggable: true },
      { key: 'customerName', name: 'Հաճախորդ', resizable: true, draggable: true },
      { key: 'customerPhone', name: 'Հաճախորդի հեռ․', resizable: true, draggable: true },
      { key: 'orderTime', name: 'Գրանցման ժամանակը', resizable: true, draggable: true },
      { key: 'prepTime', name: 'Տրման ժամանակը', resizable: true, draggable: true },
      { key: 'restaurant', name: 'Ռեստորան', resizable: true, draggable: true },
      { key: 'courier', name: 'Առաքիչ', resizable: true, draggable: true },
      { key: 'orderItems', name: 'Պատվեր', resizable: true, draggable: true ,
        renderCell: ({ row }: { row: Order }) => {
          const items = row.orderItems;
          return (
            <ItemChips>
              {items.map((item) => (
                <ItemChip key={item.id}>
                  {item.quantity}h - {item.name}
                </ItemChip>
              ))}
            </ItemChips>
          )
        },},
      {
        key: 'paidMethod',
        name: 'Վճարման եղանակը',
        resizable: true,
        draggable: true,
        width: 180,
        renderCell: ({ row }: { row: Order }) => (
          <Dropdown
            value={row.paidMethod}
            options={paymentOptions}
            placeholder="Վճարման եղանակը"
            onChange={(value) => handlePaidMethodChange(row.id, value as PaymentMethod)}
            asTableCell
            triggerDisplay="chip"
          />
        ),
      },
      { key: 'courierPhone', name: 'Առաքիչի հեռ․', resizable: true, draggable: true },
      {
        key: 'orderAddress',
        name: 'Պատվերի հասցե',
        resizable: true,
        draggable: true,
        renderCell: ({ row }: { row: Order }) => {
          const address = row.address;
          return `${address.street} ${address.building}${address.apartment ? `, Apt ${address.apartment}` : ''}${address.comment ? ` вЂ” ${address.comment}` : ''}`;
        },
      },
      {
        key: 'courierStatus',
        name: 'Առաքիչի կարգավիճակը',
        resizable: true,
        draggable: true,
        renderCell: ({ row }: { row: Order }) => (
          <Dropdown
            value={row.courierStatus}
            options={courierLocationOptions}
            placeholder="Առաքիչի կարգավիճակը"
            onChange={(value) => handleCourierStatusChange(row.id, value as CourierLocationStatus)}
            asTableCell
            triggerDisplay="chip"
          />
        ),
      },
      { key: 'operatorName', name: 'Օպերատոր', resizable: true, draggable: true },
      { key: 'status', name: 'Պատվերի կարգավիճակ', resizable: true, draggable: true ,
        renderCell: ({ row }: { row: Order }) => (
          <Dropdown
            value={row.status}
            options={orderStatusOptions}
            placeholder="Պատվերի կարգավիճակը"
            onChange={(value) => handleOrderStatusChange(row.id, value as OrderStatus)}
            asTableCell
            triggerDisplay="chip"
          />
        ),},
      { key: 'totalAmount', name: 'Գումարը', resizable: true, draggable: true },
    ],
    [handleCourierStatusChange, handlePaidMethodChange]
  );

  const filteredOrders = useMemo(
    () =>
      (orders).filter((order) => {
        const query = search.toLowerCase().trim();
        const matchesSearch =
          query === '' ||
          [order.orderCode, order.customerName, order.restaurant, order.courier].join(' ').toLowerCase().includes(query);

        const matchesStatus = activeStatus === 'all' || order.status === activeStatus;
        const matchesCourier = selectedCourier === 'all' || order.courier === selectedCourier;

        return matchesSearch && matchesStatus && matchesCourier;
      }),
    [search, activeStatus, selectedCourier, apiOrders, orderData]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [search, activeStatus, selectedCourier]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [currentPage, filteredOrders]);



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
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Որոնում։ Ռեստորան կամ առաքիչ"          />
          <Dropdown
            value={selectedCourier}
            options={couriers}
            placeholder="Ընտրել առաքիչը"
            onChange={setSelectedCourier}
          />
        </Controls>
        <ControlsRow>
          <span style={{ color: 'rgba(255,255,255,0.72)' }}> գտվել է {filteredOrders.length} պատվեր  </span>
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
      </StatusTabs>

      <TableSection>
        <Table<Order> rows={pageRows} columns={columns} />
        <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
      </TableSection>

      <Drawer open={isCreateOpen} position="bottom" title="Ստեղծել նոր պատվեր" onClose={() => setCreateOpen(false)}>
        <CreateOrderForm onClose={() => setCreateOpen(false)} />
      </Drawer>
    </div>
  );
};
