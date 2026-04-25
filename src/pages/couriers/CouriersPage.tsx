import styled from 'styled-components';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TableWrapper } from '@shared/ui/TableWrapper';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Select } from '@shared/ui/Select';
import { Drawer } from '@shared/ux/Drawer';
import { sampleCouriers } from './courierData';
import { useCouriersQuery } from '@app/hooks/dataApi';
import type { Courier } from '@shared/types';

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

const initialCourierForm = {
  name: '',
  phone: '',
  status: 'idle' as Courier['status'],
  currentOrder: '',
};

export const CouriersPage = () => {
  const [couriers, setCouriers] = useState<Courier[]>(sampleCouriers);
  const { data: apiCouriers } = useCouriersQuery();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formState, setFormState] = useState(initialCourierForm);
  const navigate = useNavigate();

  const openCreateDrawer = () => {
    setFormState(initialCourierForm);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setFormState(initialCourierForm);
  };

  const saveCourier = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.name.trim() || !formState.phone.trim()) return;

    setCouriers((current) => [
      ...current,
      {
        id: `c${Date.now()}`,
        name: formState.name.trim(),
        phone: formState.phone.trim(),
        status: formState.status,
        currentOrder: formState.currentOrder.trim() || undefined,
      },
    ]);

    closeDrawer();
  };

  const displayedCouriers = apiCouriers ?? couriers;
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
              <Th>Կարգավիճակ</Th>
              <Th>Ընդհանուր պատվեր</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {displayedCouriers.map((courier) => (
              <tr key={courier.id}>
                <Td>{courier.name}</Td>
                <Td>{courier.phone}</Td>
                <Td>
                  <Badge status={courier.status}>{courier.status}</Badge>
                </Td>
                <Td>{courier.currentOrder ?? 'None'}</Td>
                <Td>
                  <Button variant="ghost" onClick={() => navigate(`/couriers/${courier.id}`)}>
                    Track
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
          </Table>
      </TableWrapper>
      <Drawer open={isDrawerOpen} title="Ավելացնել առաքիչ" onClose={closeDrawer} position="bottom">
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
            Հեռախոս
            <Input
              value={formState.phone}
              onChange={(event) => setFormState({ ...formState, phone: event.target.value })}
              placeholder="+1 415 123 4567"
            />
          </FormField>

          <FormField>
            Կարգավիճակ
            <Select
              value={formState.status}
              onChange={(event) => setFormState({ ...formState, status: event.target.value as Courier['status'] })}
            >
              <option value="idle">Հանգստացածը</option>
              <option value="delivering">Առաքվում են</option>
              <option value="offline">Անցանց</option>
            </Select>
          </FormField>

          <FormField>
            Ընթացիկ պատվեր
            <Input
              value={formState.currentOrder}
              onChange={(event) => setFormState({ ...formState, currentOrder: event.target.value })}
              placeholder="ORD-1234"
            />
          </FormField>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button type="submit">Ստեղծել առաքիչ</Button>
            <Button type="button" variant="secondary" onClick={closeDrawer}>
              Չեղարկել
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
