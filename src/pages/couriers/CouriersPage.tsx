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
  restaurantId:""
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
  const [formState, setFormState] = useState({ ...initialCourierForm, restaurantId: '' as string });
  const { data: restaurantsApi } = useRestaurantsQuery();
  const navigate = useNavigate();

  const openCreateDrawer = () => {
    setFormState(initialCourierForm);
    setIsDrawerOpen(true);
  };

  function closeDrawer() {
    setIsDrawerOpen(false);
    setFormState(initialCourierForm);
    setSelectedCourier(null);
  };

  const saveCourier = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.name.trim() || !formState.phone.trim()) return;

    if (selectedCourier) {
      // Update existing courier
      updateCourierMutation.mutateAsync({
        id: selectedCourier.userId,
        payload: {
        name: formState.name,
        phone: formState.phone,
        status: formState.status as Courier['status'],
        currentOrder: formState.currentOrder,
        restaurantId: (formState).restaurantId,
        email: formState.email,
      } });
    } else {
      // Create new courier
      createCourierMutation.mutateAsync({
        payload:{
          email: formState.email || '',
          name: formState.name,
          phone: formState.phone,
          status: formState.status,
          currentOrder: formState.currentOrder,
          restaurantId: formState.restaurantId
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
        restaurantId:selectedCourier.restaurant?.id || '',
        email: selectedCourier?.user?.email || '',
        phone:selectedCourier?.user?.phone || '',
        status: selectedCourier.status || 'free' ,
        currentOrder: '',
        name: selectedCourier?.user?.name || '',
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
        <form onSubmit={saveCourier}>
          <FormField>
            Անուն
            <Input
              value={formState.name}
              onChange={(event) => setFormState({ ...formState, name: event.target.value })}
              placeholder="Առաքիչի անուն"
            />
          </FormField>
          <FormField>
            Ռեստորանը
            <Dropdown
              value={formState.restaurantId}
              options={restaurantOptions}
              placeholder="Ընտրել ռեստորանը"
              onChange={(value) =>  setFormState({ ...formState, restaurantId: value })}
              triggerDisplay="chip"
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
          {selectedCourier && <FormField>
            Ընթացիկ պատվեր
            <Input
              value={formState.currentOrder}
              onChange={(event) => setFormState({...formState, currentOrder: event.target.value})}
              placeholder="ORD-1234"
            />
          </FormField>
          }
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button type="submit">{selectedCourier ? 'Պահպանել' : 'Ստեղծել առաքիչ'}</Button>
            <Button type="button" variant="secondary" onClick={closeDrawer}>
              Չեղարկել
            </Button>
          </div>
        </form>
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

const FormField = styled.label`
  display: grid;
  gap: 10px;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
  margin-bottom: 18px;
`;
