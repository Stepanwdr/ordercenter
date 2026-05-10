import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Dropdown } from '@shared/ui/Dropdown';
import {CreateOrderFlow} from '@features/create-order/CreateOrderFlow.tsx';
import { Table } from '@shared/ux/Table';
import type { Column } from 'react-data-grid';
import type {Courier, CourierStatus, Order, OrderStatus} from '@shared/types';
import { Drawer } from '@shared/ux/Drawer';
import { Pagination } from '@shared/ux/Pagination.tsx';
import { useOrdersQuery } from '@app/hooks/dataApi';
import {courierLocationOptions} from "@features/select-courier-status/SelectCourierStatus.ts";
import {formatTime} from "@shared/utils/date.ts";

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
    .orders-table {
      .data-grid{
         height: calc(100vh - 423px)
        }
    }
  
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

const paymentOptions = paymentMethods.map((method) => ({ value: method, label: method }));



const orderStatusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'cooking', label: 'Պատրաստվում է' },
  { value: 'ready', label: 'Պատրաստ է' },
  { value: 'enRoute', label: 'Ճանապարհին է' },
  { value: 'done', label: 'Ավարտված' },
];

const OrdersPage = () => {
  const { data: apiOrders } = useOrdersQuery();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<(typeof statuses)[number]>('all');
  const [selectedCourier, setSelectedCourier] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
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
  const handlePaidMethodChange = useCallback((id: string, value: PaymentMethod) => {
  }, []);

  const handleCourierStatusChange = useCallback((id: string, value: CourierStatus) => {
  }, []);

  const handleOrderStatusChange = useCallback((id: string, value: OrderStatus) => {
  }, []);

  const columns = useMemo<Column<Order>[]>(
    () => [
      { key: 'code', name: 'Կոդ', resizable: true, draggable: true},
      { key: 'customerName', name: 'Հաճախորդ', resizable: true, draggable: true },
      { key: 'customerPhone', name: 'Հաճախորդի հեռ․', resizable: true, draggable: true },
      { key: 'orderTime', name: 'Գրանցման ամսաթիվը', resizable: true, draggable: true,
        renderCell: ({ row }: { row: Order }) => {
          return formatTime(row.createdAt)
        }, },
      { key: 'prepTime', name: 'Տրման Ժամը', resizable: true, draggable: true,
        renderCell: ({ row }: { row: Order }) => {
          return row?.prepTime || 'Անմիջապես';
        },
      },
      { key: 'restaurant', name: 'Ռեստորան', resizable: true, draggable: true,
        renderCell: ({ row }: { row: Order }) => {
          return row?.restaurant?.name;
        },
      },
      { key: 'courier', name: 'Առաքիչ', resizable: true, draggable: true,
        renderCell: ({ row }: { row: Order }) => {
          return row?.courierProfile?.user?.name;
        },
      },
      { key: 'orderItems', name: 'Պատվեր', resizable: true, draggable: true,
        renderCell: ({ row }: { row: Order }) => {
          const items = row.orderItems;
          return (
            <ItemChips>
              {items.map((item) => (
                <ItemChip key={item?.id}>
                  {item?.quantity}h - {item?.menuItem.name}
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
            value={row?.courierProfile?.status}
            options={courierLocationOptions}
            placeholder="Առաքիչի կարգավիճակը"
            onChange={(value) => handleCourierStatusChange(row.id, value as CourierStatus)}
            asTableCell
            triggerDisplay="chip"
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
      { key: 'price', name: 'Գումարը', resizable: true, draggable: true },
    ],
    [handleCourierStatusChange, handleOrderStatusChange, handlePaidMethodChange]
  );
  const filteredOrders = useMemo(
    () =>
      (orders).filter((order) => {
        const query = search.toLowerCase().trim();
        const matchesSearch =
          query === '' ||
          [order.orderCode, order.customerName, order.restaurant, order.courierProfile].join(' ').toLowerCase().includes(query);

        const matchesStatus = activeStatus === 'all' || order?.status === activeStatus;
        const matchesCourier = selectedCourier === 'all' || order.courierProfile.id === selectedCourier;

        return matchesSearch && matchesStatus && matchesCourier;
      }),
    [orders, search, activeStatus, selectedCourier]
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
  console.log({orders})
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
            placeholder="Որոնում։ Ռեստորան կամ առաքիչ"/>
          {/*<Dropdown*/}
          {/*  value={selectedCourier}*/}
          {/*  options={couriers}*/}
          {/*  placeholder="Ընտրել առաքիչը"*/}
          {/*  onChange={setSelectedCourier}*/}
          {/*/>*/}
        </Controls>
        <ControlsRow>
          <span style={{ color: 'rgba(255,255,255,0.72)' }}> գտնվել է {filteredOrders.length} պատվեր  </span>
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
        <Table<Order> rows={pageRows} columns={columns} className={'orders-table'} />
        <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
      </TableSection>

      <Drawer open={isCreateOpen} position="bottom" title="Ստեղծել նոր պատվեր" onClose={() => setCreateOpen(false)}>
        <CreateOrderFlow onClose={()=>setCreateOpen(false)}/>
      </Drawer>
    </div>
  );
};
export default OrdersPage