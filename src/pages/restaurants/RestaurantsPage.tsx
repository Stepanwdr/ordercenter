import { type FormEvent, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@shared/ui/Button';
import { Drawer } from '@shared/ux/Drawer';
import { Input } from '@shared/ui/Input';
import type {Address, Restaurant} from '@shared/types';
import {useCreateRestaurantMutation, useRestaurantsQuery, useUpdateRestaurantMutation, useDeleteRestaurantMutation} from '@app/hooks/dataApi';
import {ImageUploader} from "@shared/ui/ImageUploader.tsx";

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
    flex-direction: column;
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

const Wrapper=styled.div`
    display: flex;
    flex-direction: column;
    max-width: 800px;
    margin: 0 auto;
    gap: 20px;
`
const Image = styled.div`
      min-width: 150px;
      min-height: 150px;
      overflow: hidden;
    border-radius: 24px;
    img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
`

const initialFormState = {
  id: '',
  name: '',
  cuisine: '',
  addresses: [{address:""}] as Address[],
  phone: '',
  status: 'open' as Restaurant['status'],
};

export const RestaurantsPage = () => {
  const [name, setName] = useState('');
  const [lat, setLat] = useState('0');
  const [lng, setLng] = useState('0');
  const [photoUrl, setPhotUrl] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const { data: apiRestaurants } = useRestaurantsQuery();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [formState, setFormState] = useState(initialFormState);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const createRestaurant= useCreateRestaurantMutation()
  const updateRestaurant = useUpdateRestaurantMutation();
  const deleteRestaurantMutation = useDeleteRestaurantMutation();
  const mode = selectedRestaurant ? 'Edit' : 'Create';

  const openForm = (restaurant?: Restaurant) => {
    if (restaurant) {
      setSelectedRestaurant(restaurant);
      // Populate form with existing restaurant data (best effort)
      const addressesFrom = restaurant.addresses?.length
        ? restaurant.addresses.map((a) => {
            const parts = [ a.address ].filter(Boolean);
            return { address: parts.join(', ') };
          })
        : [{ address: '' }];
      setFormState({
        id: restaurant.id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        addresses: addressesFrom,
        phone: restaurant.phone,
        status: restaurant.status,
      } as any);
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
    const hasAddress = formState.addresses.some((address) => address.address.trim().length > 0);
    if (!formState.name.trim() || !hasAddress) return;
    const fd = new FormData();
    fd.append('name', formState.name);
    fd.append('lat', lat);
    fd.append('lng', lng);
    fd.append('phone', formState.phone);
    if (photoUrl) {
      fd.append('photo', photoUrl );
    }

     fd.append('cuisine', cuisine);
    const  addresses= formState.addresses
    if (addresses.length) {
      fd.append('addresses',JSON.stringify(addresses));
    }
    if (selectedRestaurant) {
      updateRestaurant.mutateAsync({ id: selectedRestaurant.id, payload: fd });
    } else {
      createRestaurant.mutateAsync(fd);
    }
    closeForm();
  };

  const handleDeleteRestaurant = (id: string) => {
    if (!window.confirm('Удалить ресторан?')) return;
    deleteRestaurantMutation.mutate(id);
  };


  const displayedRestaurants = apiRestaurants?.data || []
  return (
    <PageRoot>
      <Header>
        <div>
          <Title>Ռեստորաններ</Title>
          <FooterText>{displayedRestaurants.length} ռեստորան</FooterText>
        </div>
        <Button variant="primary" onClick={() => openForm()}>
          Ավելացնել ռեստորան
        </Button>
      </Header>
      <Grid>
        {displayedRestaurants.map((restaurant) => (
          <Card key={restaurant.id}>
            <CardHeader>
              <Image>
                <img src={'https://assets.cntraveller.in/photos/6916c7e2b3040f358c22b7ed/master/w_1600%2Cc_limit/DSC01647.JPG'} alt=""/>
              </Image>
              <div>
                <CardTitle>{restaurant.name}</CardTitle>
                <CardMeta>{restaurant.cuisine}</CardMeta>
              </div>
            </CardHeader>
            <CardContent>
              {/*{restaurant.photo && <Image>*/}
              {/*  <img*/}
              {/*    src={(restaurant.photo.startsWith('http') || restaurant.photo.startsWith('//'))*/}
              {/*      ? restaurant.photo*/}
              {/*      : `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'}${restaurant.photo}`}*/}
              {/*    alt={restaurant.name}*/}
              {/*  />*/}
              {/*</Image>}*/}
              <AddressList>
                {restaurant.addresses?.map((address: Address, index: number) => (
                  <AddressItem key={`${restaurant.id}-address-${index}`}>
                    {typeof address === 'string'
                      ? address
                      : [address.address]
                          .filter(Boolean)
                          .join(', ')}
                  </AddressItem>
                ))}
              </AddressList>
              <CardMeta>Phone: {restaurant.phone}</CardMeta>
            </CardContent>
            <Actions>
              <Button variant="secondary" onClick={() => openForm(restaurant)}>
                Խմբագրել
              </Button>
              <Button variant="ghost" onClick={() => handleDeleteRestaurant(restaurant.id)}>
                Ջնջել
              </Button>
            </Actions>
          </Card>
        ))}
      </Grid>

      <Drawer open={isDrawerOpen} title={`${mode === 'Create' ? 'Ստեղծել' : 'Խմբագրել'} ռեստորան`} onClose={closeForm} position="bottom">
        <form onSubmit={saveRestaurant}>
          <Wrapper>
            <Field>
              Անուն
              <Input
                value={formState.name}
                onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                placeholder="Ռեստորանի անուն"
              />
            </Field>
            <Field>
              Հեռախոսահամար
              <Input
                value={formState.phone}
                onChange={(event) => setFormState({ ...formState, phone: event.target.value })}
                placeholder="+374 98 888 888"
              />
            </Field>
            {/*<label>Фото</label>*/}
            {/*<ImageUploader value={photoUrl} onChange={(payload)=>{*/}
            {/*  console.log(payload)*/}
            {/*  setPhotUrl(payload?.url || '')*/}
            {/*  setPhotoFile(payload?.file as File | null)*/}
            {/*}} />*/}
            {/*<Input placeholder="URL или оставьте пустым" value={photoUrl} onChange={(e) => setPhotoFile(e.target.value)} />*/}
            <Field>
              Հասցեներ
              <div>
                {formState.addresses.map((address, addressIndex) => (
                  <AddressRow key={`address-${addressIndex}`}>
                    <Input
                      value={address.address}
                      onChange={(event) => {
                        const nextAddresses = [...formState.addresses];
                        nextAddresses[addressIndex].address = event.target.value;
                        setFormState({ ...formState, addresses: nextAddresses });
                      }}
                      placeholder="Քաղաք,թաղամաս,շենք"
                    />
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => {
                        setFormState((current) => {
                          const nextAddresses = current.addresses.filter((_, index) => index !== addressIndex);
                          return { ...current, addresses: nextAddresses };
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
                onClick={() => setFormState((current) => ({ ...current, addresses: [...current.addresses,{address:""}] }))}
              >
                Add address
              </Button>
            </Field>

              <Actions>
                <Button type="submit">Պահել</Button>
                <Button variant="secondary" type="button" onClick={closeForm}>
                  Չեղարկել
                </Button>
              </Actions>
          </Wrapper>

        </form>
      </Drawer>
      {/* Inline delete button for each restaurant */}
    </PageRoot>
  );
};
