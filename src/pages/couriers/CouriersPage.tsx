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
import type {Courier} from '@shared/types';
import {Dropdown} from "@shared/ui/Dropdown.tsx";
import {courierLocationOptions, getStatusLabelOptions} from "@features/select-courier-status/SelectCourierStatus.ts";
import {toast} from "react-toastify";


const initialCourierForm = {
  name: '',
  phone: '',
  status: 'free' as Courier['status'],
  currentOrder: '',
  email:'',
  restaurantId:""
};

 const CouriersPage = () => {
  const { data: apiCouriers } = useCouriersQuery();
  const createCourierMutation = useCreateCourierMutation(closeDrawer);
  const updateCourierMutation = useUpdateCourierMutation(closeDrawer);
  const deleteCourierMutation = useDeleteCourierMutation();
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
  const handleEdit = ( courier:Courier)=> {
     setSelectedCourier(courier)
  }


  const displayedCouriers = apiCouriers?.data || [];

  const restaurantOptions=  restaurantsApi?.data?.map(restaurant => ({value:restaurant.id,label:restaurant.name})) || [];


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
                  <Button variant="ghost" onClick={() => navigate(`/couriers/${cid}`)}>
                    Դիտել
                  </Button>
                  <Button variant="secondary" onClick={() => handleEdit(courier)} style={{ marginLeft: '10px' }}>
                    Խմբագրել
                  </Button>
                  <Button variant="secondary" onClick={() => handleDelete(cid)} style={{ marginLeft: '10px' }}>
                    Ջնջել
                  </Button>
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
