import { type FormEvent, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@shared/ui/Button';
import { Drawer } from '@shared/ux/Drawer';
import { Input } from '@shared/ui/Input';
import type { Restaurant } from '@shared/types';
import { sampleRestaurants } from './restaurantData';

const PageRoot = styled.main`
  padding: 32px;
  box-sizing: border-box;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
`;

const Title = styled.h1`
  margin: 0;
`;

const Grid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.article`
  display: grid;
  gap: 16px;
  padding: 24px;
  border-radius: 24px;
  background: rgba(18, 24, 44, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 22px 48px rgba(0, 0, 0, 0.18);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
`;

const CardMeta = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.66);
  line-height: 1.6;
`;

const Badge = styled.span<{ status: Restaurant['status'] }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  color: #fff;
  background: ${({ status }) =>
    status === 'open' ? '#34d399' : status === 'busy' ? '#f59e0b' : 'rgba(255, 255, 255, 0.12)'};
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const CardContent = styled.div`
  display: grid;
  gap: 10px;
`;

const AddressList = styled.div`
  display: grid;
  gap: 8px;
`;

const AddressItem = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
`;

const Field = styled.label`
  display: grid;
  gap: 10px;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;
`;

const AddressRow = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr auto;
  align-items: center;
`;

const FooterText = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.7;
`;

const initialFormState = {
  id: '',
  name: '',
  cuisine: '',
  addresses: [''],
  phone: '',
  status: 'open' as Restaurant['status'],
};

export const RestaurantsPage = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(sampleRestaurants);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [formState, setFormState] = useState(initialFormState);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const mode = selectedRestaurant ? 'Edit' : 'Create';

  const openForm = (restaurant?: Restaurant) => {
    if (restaurant) {
      setSelectedRestaurant(restaurant);
      setFormState(restaurant);
    } else {
      setSelectedRestaurant(null);
      setFormState(initialFormState);
    }
    setIsDrawerOpen(true);
  };

  const closeForm = () => {
    setIsDrawerOpen(false);
    setSelectedRestaurant(null);
    setFormState(initialFormState);
  };

  const saveRestaurant = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hasAddress = formState.addresses.some((address) => address.trim().length > 0);
    if (!formState.name.trim() || !hasAddress) return;

    const normalized = {
      ...formState,
      addresses: formState.addresses.filter((address) => address.trim().length > 0),
    };

    setRestaurants((current) => {
      if (selectedRestaurant) {
        return current.map((item) => (item.id === selectedRestaurant.id ? normalized : item));
      }

      return [
        { ...normalized, id: `r${Date.now()}` },
        ...current,
      ];
    });

    closeForm();
  };

  const deleteRestaurant = (id: string) => {
    if (!window.confirm('Удалить ресторан?')) return;
    setRestaurants((current) => current.filter((item) => item.id !== id));
  };

  const totalOpen = useMemo(() => restaurants.filter((restaurant) => restaurant.status === 'open').length, [restaurants]);

  return (
    <PageRoot>
      <Header>
        <div>
          <Title>Ռեստորաններ</Title>
          <FooterText>{restaurants.length} ռեստորան, {totalOpen} աւրեխներ</FooterText>
        </div>
        <Button variant="primary" onClick={() => openForm()}>
          Ավելացնել ռեստորան
        </Button>
      </Header>
      <Grid>
        {restaurants.map((restaurant) => (
          <Card key={restaurant.id}>
            <CardHeader>
              <div>
                <CardTitle>{restaurant.name}</CardTitle>
                <CardMeta>{restaurant.cuisine}</CardMeta>
              </div>
              <Badge status={restaurant.status}>{restaurant.status}</Badge>
            </CardHeader>
            <CardContent>
              <AddressList>
                {restaurant.addresses.map((address, index) => (
                  <AddressItem key={`${restaurant.id}-address-${index}`}>{address}</AddressItem>
                ))}
              </AddressList>
              <CardMeta>Phone: {restaurant.phone}</CardMeta>
            </CardContent>
            <Actions>
              <Button variant="secondary" onClick={() => openForm(restaurant)}>
                Խմբագրել
              </Button>
              <Button variant="ghost" onClick={() => deleteRestaurant(restaurant.id)}>
                Ջնջել
              </Button>
            </Actions>
          </Card>
        ))}
      </Grid>

      <Drawer open={isDrawerOpen} title={`${mode === 'Create' ? 'Ստեղծել' : 'Խմբագրել'} ռեստորան`} onClose={closeForm} position="bottom">
        <form onSubmit={saveRestaurant}>
          <Field>
            Անուն
            <Input
              value={formState.name}
              onChange={(event) => setFormState({ ...formState, name: event.target.value })}
              placeholder="Ռեստորանի անուն"
            />
          </Field>

          <Field>
           Հասցեներ
            <div>
              {formState.addresses.map((address, addressIndex) => (
                <AddressRow key={`address-${addressIndex}`}>
                  <Input
                    value={address}
                    onChange={(event) => {
                      const nextAddresses = [...formState.addresses];
                      nextAddresses[addressIndex] = event.target.value;
                      setFormState({ ...formState, addresses: nextAddresses });
                    }}
                    placeholder="Street, city, country"
                  />
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setFormState((current) => {
                        const nextAddresses = current.addresses.filter((_, index) => index !== addressIndex);
                        return { ...current, addresses: nextAddresses.length ? nextAddresses : [''] };
                      });
                    }}
                  >
                    Remove
                  </Button>
                </AddressRow>
              ))}
            </div>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setFormState((current) => ({ ...current, addresses: [...current.addresses, ''] }))}
            >
              Add address
            </Button>
          </Field>

          <Field>
            Phone
            <Input
              value={formState.phone}
              onChange={(event) => setFormState({ ...formState, phone: event.target.value })}
              placeholder="+374 98 888 888"
            />
          </Field>

          <Actions>
            <Button type="submit">Պահել</Button>
            <Button variant="secondary" type="button" onClick={closeForm}>
              Չեղարկել
            </Button>
          </Actions>
        </form>
      </Drawer>
    </PageRoot>
  );
};
