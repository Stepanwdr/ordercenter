import styled from 'styled-components';
import {type FormEvent, useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { TableWrapper } from '@shared/ui/TableWrapper';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Drawer } from '@shared/ux/Drawer';
import {
  useCouriersQuery,
  useCreateCourierMutation,
  useDeleteCourierMutation,
  useRestaurantsQuery,
  useUpdateCourierMutation,
} from '@app/hooks/dataApi';
import type {Courier, Order} from '@shared/types';
import {Dropdown} from "@shared/ui/Dropdown.tsx";
import {courierLocationOptions, getStatusLabelOptions} from "@features/select-courier-status/SelectCourierStatus.ts";
import {toast} from "react-toastify";
import {api} from "@shared/api/base.ts";


const initialCourierForm = {
  name: '',
  phone: '',
  status: 'free' as Courier['status'],
  currentOrder: '',
  email:'',
  maxOrders: 3,
};

 const CouriersPage = ({selectedOrder,handleCourierAsignToOrder}:{selectedOrder?:Order | null, handleCourierAsignToOrder?:(courierId:string)=>void}) => {
  const { data: apiCouriers } = useCouriersQuery();
  const createCourierMutation = useCreateCourierMutation(closeDrawer);
  const updateCourierMutation = useUpdateCourierMutation(closeDrawer);
  const deleteCourierMutation = useDeleteCourierMutation();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formState, setFormState] = useState({ ...initialCourierForm });
  const [courierOrders, setCourierOrders] = useState<Order[]>([]);
  const { data: restaurantsApi } = useRestaurantsQuery();
  const navigate = useNavigate();

  // Load the selected courier's orders to show their current (active) ones as cards.
  useEffect(() => {
    if (!selectedCourier) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCourierOrders([]);
      return;
    }
    api
      .get<{ data: Order[] }>(`/orders?courierId=${selectedCourier.userId}&limit=50`)
      .then((res) => setCourierOrders(res.data?.data ?? []))
      .catch(() => setCourierOrders([]));
  }, [selectedCourier]);

  const activeCourierOrders = courierOrders.filter(
    (o) => !['done', 'completed', 'cancelled'].includes(o.status),
  );

  const openCreateDrawer = () => {
    setFormState(initialCourierForm);
    setIsDrawerOpen(true);
  };

  function closeDrawer() {
    setIsDrawerOpen(false);
    setFormState(initialCourierForm);
    setSelectedCourier(null);
  };

  const saveCourier = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.name.trim() || !formState.phone.trim()) return;

    if (selectedCourier) {
      // Update existing courier
      await updateCourierMutation.mutateAsync({
        id: selectedCourier.userId,
        payload: {
          name: formState.name,
          phone: formState.phone,
          status: formState.status as Courier['status'],
          currentOrder: formState.currentOrder,
          email: formState.email,
          maxOrders: Number(formState.maxOrders) || 0,
        }
      });
    } else {
      // Create new courier
      await createCourierMutation.mutateAsync({
          payload: {
            email: formState.email || '',
            name: formState.name,
            phone: formState.phone,
            status: formState.status,
            currentOrder: formState.currentOrder,
            maxOrders: Number(formState.maxOrders) || 0,
          }
        }
      );
    }
  };

  const handleDelete =async( id:string)=>{
    if (!window.confirm('Ջնջել առաքիչին')) return;
    await deleteCourierMutation.mutateAsync(id);
    toast.success("Առաքիչը ջնջվեց համակարգից")
  }

  const displayedCouriers = apiCouriers?.data || [];

  const restaurantOptions=  restaurantsApi?.data?.map(restaurant => ({value:restaurant.id,label:restaurant.name})) || [];

const editOptions=[

  {label:<Button style={{width:'100%'}} variant="primary" >
     Դիտել
    </Button>,
    value:"show"
  },
  {label:<Button style={{width:'100%'}} variant="secondary" >
      Ստանալ բոտի հղում
    </Button>,
    value:"botLink"
  },
  {label:<Button style={{width:'100%'}} variant="secondary" >
     Ջնջել
    </Button>,
    value:"delete"
  },
  {label:<Button style={{width:'100%'}} variant="secondary" >
      Խմբագրել
    </Button>,
    value:"edit"
  },
  ...(handleCourierAsignToOrder ? [{label:<Button style={{width:'100%'}} variant="secondary" >
      Նշանակել պատվեր
    </Button>,
    value:"asignCourier"
  }]:[]),
  ]

   const handleAction =async (action:string,courier:Courier)=>{
     console.log(action)
       if(action === 'asignCourier' && handleCourierAsignToOrder){
         handleCourierAsignToOrder(courier.userId)
       }
       if(action === 'show') {
         navigate(`/couriers/${courier.userId}`)
       }
       if(action === 'delete') {
         await handleDelete(courier.userId)
       }
       if(action === 'edit') {
         setSelectedCourier(courier)
       }
       if(action === 'botLink') {
          try{
      const res = await api.post(`/couriers/${courier.userId}/generate-telegram-link`);
           const data = await res.data.data
         if (data  && data.link) {
            setGeneratedLink(data.link);
              setIsLinkModalOpen(true);
            } else {
            toast.error('Link generation failed')
             }
          } catch (err) { toast.error('Network error'); }

       }
   }

  useEffect(() => {
    if (selectedCourier){
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormState({
        ...initialCourierForm,
        email: selectedCourier?.user?.email || '',
        phone:selectedCourier?.user?.phone || '',
        status: selectedCourier.status || 'free' ,
        currentOrder: '',
        name: selectedCourier?.user?.name || '',
        maxOrders: selectedCourier.maxOrders ?? 3,
      })
    }

  },[selectedCourier])

  return (
    <div>
      <PageHeader>
        <Title>Առաքիչներ</Title>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button variant="secondary">Թարմացնել ցուցակը</Button>
          <Button variant="primary" onClick={openCreateDrawer}>
            Ավելացնել առաքիչ
          </Button>
        </div>
      </PageHeader>
      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <Th>Անուն</Th>
              <Th>Հեռախոս</Th>
              <Th>Էլ հասցե</Th>
              <Th>Կարգավիճակ</Th>
              <Th>Բեռնվածություն</Th>
              <Th>Ռեստորան</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
        {displayedCouriers.map((courier) => {
            const cid = courier.userId;
            const displayName = courier?.user?.name || '';
            const displayPhone = courier?.user?.phone ||'';
            const email = courier?.user?.email ||'';
            const restoran = courier?.restaurant?.name ||'';
            return (
              <tr key={cid}>
                <Td>{displayName}</Td>
                <Td>{displayPhone}</Td>
                <Td>
                  {email}
                </Td>
                <Td>
                  <Badge status={courier.status}>{getStatusLabelOptions[courier.status]}</Badge>
                </Td>
                <Td>
                  <CourierLoad courier={courier} />
                </Td>
                <Td>{restoran}</Td>
                <Td>
                  <Dropdown triger={
                    <><svg width="4" height="16" viewBox="0 0 4 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14C0 13.45 0.195833 12.9792 0.5875 12.5875C0.979167 12.1958 1.45 12 2 12C2.55 12 3.02083 12.1958 3.4125 12.5875C3.80417 12.9792 4 13.45 4 14C4 14.55 3.80417 15.0208 3.4125 15.4125C3.02083 15.8042 2.55 16 2 16ZM2 10C1.45 10 0.979167 9.80417 0.5875 9.4125C0.195833 9.02083 0 8.55 0 8C0 7.45 0.195833 6.97917 0.5875 6.5875C0.979167 6.19583 1.45 6 2 6C2.55 6 3.02083 6.19583 3.4125 6.5875C3.80417 6.97917 4 7.45 4 8C4 8.55 3.80417 9.02083 3.4125 9.4125C3.02083 9.80417 2.55 10 2 10ZM2 4C1.45 4 0.979167 3.80417 0.5875 3.4125C0.195833 3.02083 0 2.55 0 2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0C2.55 0 3.02083 0.195833 3.4125 0.5875C3.80417 0.979167 4 1.45 4 2C4 2.55 3.80417 3.02083 3.4125 3.4125C3.02083 3.80417 2.55 4 2 4Z" fill="#3D4A3D"/>
                    </svg>
                    </>
                  } value={'action'} onChange={(value)=>handleAction(value,courier)} options={editOptions} />
                </Td>
              </tr>
            );
        })}
          </tbody>
          </Table>
      </TableWrapper>
      <Drawer open={isDrawerOpen || Boolean(selectedCourier)} title={selectedCourier ? "Խմբագրել" : 'Ավելացնել առաքիչ'} onClose={closeDrawer} position="bottom">
        <CourierForm onSubmit={saveCourier} >
          <FormField>
            Անուն
            <Input
              value={formState.name}
              onChange={(event) => setFormState({ ...formState, name: event.target.value })}
              placeholder="Առաքիչի անուն"
            />
          </FormField>
          <FormField>
            Հեռախոս
            <Input
              value={formState.phone}
              onChange={(event) => setFormState({ ...formState, phone: event.target.value })}
              placeholder="+1 415 123 4567"
            />
          </FormField>
          <FormField>
            Էլ հասցե
            <Input
              value={formState.email}
              onChange={(event) => setFormState({ ...formState, email: event.target.value })}
              placeholder="youremail@gmail.com"
            />
          </FormField>
          <FormField>
            Կարգավիճակ
            <Dropdown
              value={formState.status}
              options={courierLocationOptions}
              placeholder="Առաքիչի կարգավիճակը"
              onChange={(value) =>  setFormState({ ...formState, status: value as Courier['status']})}
              triggerDisplay="chip"
            />
          </FormField>
          <FormField>
            Առավելագույն պատվերներ (բեռնվածություն)
            <Input
              type="number"
              min={0}
              value={String(formState.maxOrders)}
              onChange={(event) => setFormState({ ...formState, maxOrders: Number(event.target.value) })}
              placeholder="3"
            />
          </FormField>
          {selectedCourier && (
            <OrdersBlock>
              <OrdersBlockLabel>
                Ընթացիկ պատվերներ
                <OrdersCount>{activeCourierOrders.length}</OrdersCount>
              </OrdersBlockLabel>
              {activeCourierOrders.length === 0 ? (
                <EmptyOrders>Ակտիվ պատվերներ չկան</EmptyOrders>
              ) : (
                activeCourierOrders.map((order) => {
                  const view = ORDER_STATUS_VIEW[order.status] || { label: order.status, color: '#64748b' };
                  return (
                    <MiniOrderCard key={order.id}>
                      <MiniOrderHead>
                        <MiniOrderCode>#{order.code}</MiniOrderCode>
                        <MiniOrderStatus $color={view.color}>{view.label}</MiniOrderStatus>
                      </MiniOrderHead>
                      <MiniOrderMeta>
                        {order.customerName && <div>👤 {order.customerName}{order.customerPhone ? ` · ${order.customerPhone}` : ''}</div>}
                        {order.deliveryAddress && <div>📍 {order.deliveryAddress}</div>}
                        <div>💰 ${order.price?.toFixed(2)}</div>
                      </MiniOrderMeta>
                    </MiniOrderCard>
                  );
                })
              )}
            </OrdersBlock>
          )}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button type="submit">{selectedCourier ? 'Պահպանել' : 'Ստեղծել առաքիչ'}</Button>
            <Button type="button" variant="secondary" onClick={closeDrawer}>
              Չեղարկել
            </Button>
          </div>
        </CourierForm>
      </Drawer>
      {isLinkModalOpen && (
        <div role="dialog" aria-modal style={{position:'fixed',left:0,top:0,right:0,bottom:0,display:'grid',placeItems:'center',background:'rgba(0,0,0,0.4)'}} onClick={()=>setIsLinkModalOpen(false)}>
          <div onClick={(e)=>e.stopPropagation()} style={{background:'#fff',padding:20,borderRadius:8,minWidth:320}}>
            <h3 style={{color:'black'}}>Telegram link</h3>
            <p style={{wordBreak:'break-all',color:'black'}}>{generatedLink}</p>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <Button variant="primary"><a target={'_blank'} href={generatedLink}>Մեկնարկել բոտը</a></Button>
              <Button variant="primary" onClick={()=>{navigator.clipboard.writeText(generatedLink);toast.success('Copied')}}>Կրկնօրինակել</Button>
              <Button onClick={()=>setIsLinkModalOpen(false)}>Փակել</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CouriersPage;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  margin: 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 720px;
`;

const Th = styled.th`
  padding: 18px 16px;
  text-align: left;
  color: rgba(255, 255, 255, 0.74);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const Td = styled.td`
  padding: 18px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
`;

const Badge = styled.span<{ status: string }>`
  display: inline-flex;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  background: ${({ status }) =>
  status === 'delivering' ? '#9d7cff' : status === 'offline' ? 'rgba(255, 255, 255, 0.08)' : '#34d399'};
  color: #fff;
`;

const LoadWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 130px;
`;

const LoadText = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
`;

const LoadCount = styled.span`
  font-weight: 700;
`;

const LoadFree = styled.span<{ $full: boolean }>`
  font-size: 12px;
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

const CourierLoad = ({ courier }: { courier: Courier }) => {
  const max = courier.maxOrders ?? 0;
  const active = courier.activeOrdersCount ?? 0;
  const free = courier.availableSlots ?? Math.max(0, max - active);
  const full = free <= 0;
  const pct = max > 0 ? Math.min(100, Math.round((active / max) * 100)) : 0;
  return (
    <LoadWrap>
      <LoadText>
        <LoadCount>{active} / {max}</LoadCount>
        <LoadFree $full={full}>{full ? 'Լրացված է' : `Ազատ՝ ${free}`}</LoadFree>
      </LoadText>
      <LoadTrack><LoadFill $pct={pct} $full={full} /></LoadTrack>
    </LoadWrap>
  );
};

const FormField = styled.label`
  display: grid;
  gap: 10px;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
  margin-bottom: 18px;
`;

const OrdersBlock = styled.div`
  display: grid;
  gap: 10px;
  margin-bottom: 18px;
`;

const OrdersBlockLabel = styled.div`
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OrdersCount = styled.span`
  padding: 1px 9px;
  border-radius: 999px;
  background: rgba(79, 143, 255, 0.2);
  color: #4f8fff;
  font-size: 12px;
  font-weight: 700;
`;

const MiniOrderCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 12px 14px;
`;

const MiniOrderHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

const MiniOrderCode = styled.span`
  font-weight: 700;
  font-size: 14px;
`;

const MiniOrderStatus = styled.span<{ $color: string }>`
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}22`};
  border: 1px solid ${({ $color }) => `${$color}44`};
`;

const MiniOrderMeta = styled.div`
  font-size: 12px;
  opacity: 0.65;
  line-height: 1.6;
`;

const EmptyOrders = styled.div`
  padding: 16px;
  text-align: center;
  font-size: 13px;
  opacity: 0.5;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
`;

const CourierForm = styled.form`

`
const ORDER_STATUS_VIEW: Record<string, { label: string; color: string }> = {
  pending: { label: 'Սպասման մեջ', color: '#9ca3ff' },
  accepted: { label: 'Ընդունված', color: '#38bdf8' },
  cooking: { label: 'Պատրաստվում է', color: '#f59e0b' },
  ready: { label: 'Պատրաստ է', color: '#38bdf8' },
  picked_up: { label: 'Վերցված', color: '#8b5cf6' },
  delivering: { label: 'Առաքվում է', color: '#9d7cff' },
  enRoute: { label: 'Ճանապարհին է', color: '#9d7cff' },
  done: { label: 'Ավարտված', color: '#34d399' },
  completed: { label: 'Կատարված', color: '#34d399' },
  cancelled: { label: 'Չեղարկված', color: '#ef4444' },
};
