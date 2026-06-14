import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Dropdown } from '@shared/ui/Dropdown';
import {useRestaurantsQuery, useCreateOrderMutation} from '@app/hooks/dataApi';
import { useCategoriesQuery, useMenuItemsQuery, useMenusQuery } from '@app/hooks/menuApi';
import type { MenuItem } from '@shared/types/Menu';
import {CustomerBlock} from "@features/create-order/CustomerBlock.tsx";
import { toast } from 'react-toastify';
import { getDrafts, saveDraft, deleteDraft, type OrderDraft } from '@features/create-order/drafts';

type CartItem = MenuItem & { count: number };

const toCurrency = (value: number) => `${value.toFixed(2)}դր`;

export const CreateOrderFlow = ({onClose}:{onClose:()=>void}) => {
  const { data: restaurantsResponse } = useRestaurantsQuery();
  const restaurants = restaurantsResponse?.data ?? [];
  const categories = useCategoriesQuery().data ?? [];

  const [formData, setFormData] = useState({
    customerPhone:"",
    deliveryAddress:"",
    entrance:"",
    domofon:"",
    addressComment:"",
    customerName:"",
    orderType:"delivery",
    city:"",
    street:'',
    building:"",
    apartment:"",
    floor:"",
  });

  const [restaurantId, setRestaurantId] = useState('');
  const [courierId, setCourierId] = useState('');
  const menus = useMenusQuery(restaurantId || null).data ?? [];
  const menuId = menus.length && menus[0].id;

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const items = useMenuItemsQuery(menuId || null, debouncedSearch).data ?? [];

  const [search, setSearch] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pickupTime, setPickupTime] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [drafts, setDrafts] = useState<OrderDraft[]>(() => getDrafts());

  const restaurantOptions = restaurants.map((r) => ({ value: r.id, label: r.name }));


  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const byCategory = activeCategoryId === 'all' || item.categoryId === activeCategoryId;
      return byCategory;
    });
  }, [items, activeCategoryId]);

   const mutate =useCreateOrderMutation()

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const found = prev.find((cartItem) => cartItem.id === item.id);
      if (!found) return [...prev, { ...item, count: 1 }];
      return prev.map((cartItem) => (cartItem.id === item.id ? { ...cartItem, count: cartItem.count + 1 } : cartItem));
    });
  };

  const changeCount = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, count: Math.max(0, item.count + delta) } : item))
        .filter((item) => item.count > 0)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.count, 0);
  const tax = subtotal * 0.08;
  const deliveryFeeNum = Number(deliveryFee) || 0;
  const total = subtotal + tax + deliveryFeeNum;

  const handleCreatOrder =async () => {
    // assemble payload and create order
    if (!restaurantId) {
      alert('Ընտրեք ռեստորան');
      return;
    }
    if (cart.length === 0) {
      alert('Ընտրեք առնվազն մեկ ապրանք');
      return;
    }
    const orderItems = cart.map((c) => ({menuItemId: c.id, quantity: c.count, price: c.price}));
    const deliveryAddress = `${formData.city || ''}, ${formData.street || ''}, ${formData.building || ''},`;
    const payload: any = {
      price: total,
      deliveryFee: deliveryFeeNum,
      restaurantId,
      ...formData,
      prepTime:pickupTime,
      deliveryAddress,
      orderItems,
    };
    if (courierId) payload.courierId = courierId;
    await mutate.mutateAsync(payload);
    if (draftId) {
      deleteDraft(draftId); // order sent — drop its draft
      setDraftId(undefined);
    }
    onClose()
  }

  const isEmpty = !restaurantId && cart.length === 0;

  const handleSaveDraft = () => {
    if (isEmpty) {
      toast.info('Պահպանելու բան չկա');
      return;
    }
    const saved = saveDraft({ id: draftId, restaurantId, cart, formData, pickupTime, deliveryFee });
    setDraftId(saved.id);
    setDrafts(getDrafts());
    toast.success('Սևագիրը պահպանվեց');
    onClose(); // set aside
  };

  const handleRestoreDraft = (d: OrderDraft) => {
    setRestaurantId(d.restaurantId || '');
    setCart(d.cart || []);
    setFormData((prev) => ({ ...prev, ...d.formData }));
    setPickupTime(d.pickupTime || '');
    setDeliveryFee(d.deliveryFee || '');
    setDraftId(d.id);
  };

  const handleDeleteDraft = (id: string) => {
    deleteDraft(id);
    setDrafts(getDrafts());
    if (draftId === id) setDraftId(undefined);
  };
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  return (
    <Page>
      <Main>
        {drafts.length > 0 && (
          <DraftsPanel>
            <DraftsTitle>Սևագրեր ({drafts.length})</DraftsTitle>
            <DraftsList>
              {drafts.map((d) => {
                const rName = restaurants.find((r) => r.id === d.restaurantId)?.name || 'Ռեստоран ?';
                const dTotal = (d.cart || []).reduce((s, it) => s + Number(it.price) * it.count, 0);
                const isCurrent = d.id === draftId;
                return (
                  <DraftChip key={d.id} $active={isCurrent}>
                    <DraftInfo onClick={() => handleRestoreDraft(d)}>
                      <strong>{rName}</strong>
                      <span>
                        {d.formData?.customerName ? `${d.formData.customerName} · ` : ''}
                        {(d.cart || []).length} ապр. · {toCurrency(dTotal)}
                      </span>
                    </DraftInfo>
                    <DraftDel onClick={() => handleDeleteDraft(d.id)} title="Ջնջել">✕</DraftDel>
                  </DraftChip>
                );
              })}
            </DraftsList>
          </DraftsPanel>
        )}
        <Dropdowns>
          <Dropdown label={'Ռետտորան'} value={restaurantId} options={restaurantOptions} placeholder="Ընտրել ռեստորան" onChange={(val) => { setRestaurantId(val) }} />
        </Dropdowns>
        <SearchPanel>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Որոնել ապրանք..." />
          <Chips>
            <Chip type="button" $active={activeCategoryId === 'all'} onClick={() => setActiveCategoryId('all')}>
             Բոլորը
            </Chip>
            {categories.map((category) => (
              <Chip
                key={category.id}
                type="button"
                $active={activeCategoryId === category.id}
                onClick={() => setActiveCategoryId(category.id)}
              >
                {category.name}
              </Chip>
            ))}
          </Chips>
        </SearchPanel>
        {filteredItems.length > 0 &&<MenuItemsSell>
          <Panel>
            <MenuItems style={{overflow: 'auto', maxHeight: "600px"}}>
              {filteredItems.map((item) => (
                <DishCard key={item.id}>
                  <DishImage>
                    {item.image ? <img src={item.image} alt={item.name}/> : null}
                  </DishImage>
                  <DishName>{item.name}</DishName>
                  <Muted>{item.description ?? 'No description'}</Muted>
                  <TotalRow>
                    <span>{item.category?.name ?? 'Category'}</span>
                    <strong>{toCurrency(Number(item.price))}</strong>
                  </TotalRow>
                  <Button type="button" variant="secondary" onClick={() => addToCart(item)}>
                    Ավելացնել
                  </Button>
                </DishCard>
              ))}
            </MenuItems>
          </Panel>
        </MenuItemsSell>}
        {cart.length > 0 && <CustomerBlock setFormData={(field, value) => setFormData(prevState => ({...prevState, [field]: value}))}
                        formData={formData}/>
        }
        {cart.length > 0 &&
          <InputWrapper>
            <Label>
              Տրման ժամը
            </Label>
             {/*<Input*/}
             {/*   type="date"*/}
             {/*   value={pickupTime}*/}
             {/*   onChange={(event) => setPickupTime(event.target.value)}*/}
             {/*   placeholder="Տրման ժամը"*/}
             {/* />*/}
              <Input
                type="time"
                value={pickupTime}
                onChange={(event) => setPickupTime(event.target.value)}
                placeholder="Տրման ժամը"
              />
         </InputWrapper>
        }
        {cart.length > 0 &&
          <InputWrapper>
            <Label>
              Առաքման գումարը
            </Label>
            <Input
              type="number"
              min={0}
              value={deliveryFee}
              onChange={(event) => setDeliveryFee(event.target.value)}
              placeholder="0"
            />
         </InputWrapper>
        }
      </Main>
      <OrderPanel>
        <Title style={{ fontSize: '1.4rem' }}>Պատվեր</Title>
         <CartList>
          {cart.map((item) => (
            <CartRow key={item.id}>
              <div style={{display: "flex", alignItems: "center", gap: '5px'}}>
                <DishImage style={{width: "60px", margin: '10px 0'}}>
                  {item.image ? <img src={item.image} alt={item.name}/> : null}
                </DishImage>
                <DishName>{item.name}</DishName>
                <Muted>{toCurrency(Number(item.price))}</Muted>
              </div>
              <Counter>
                <CounterBtn type="button" onClick={() => changeCount(item.id, -1)}>-</CounterBtn>
                <span>{item.count}</span>
                <CounterBtn type="button" onClick={() => changeCount(item.id, 1)}>+</CounterBtn>
              </Counter>
            </CartRow>
          ))}
          {cart.length === 0 && <Muted>Ընտրել ապրանք պատվիրելու համար.</Muted>}
        </CartList>
        <Totals>
          <TotalRow><span>Տրման ժամը</span><span>{pickupTime || 'Անիմջապես'}</span></TotalRow>
          <TotalRow><span>Առաքում</span><span>{toCurrency(deliveryFeeNum)}</span></TotalRow>
          <TotalRow><strong>Գումարը</strong><strong>{toCurrency(total)}</strong></TotalRow>
        </Totals>
        <FooterActions>
          <Button type="button" variant="secondary" onClick={handleSaveDraft}>Պահպանել</Button>
          <Button type="button" variant="ghost" onClick={handleCreatOrder}>Ուղարկել խոհանոց</Button>
        </FooterActions>
      </OrderPanel>
    </Page>
  );
};

const DraftsPanel = styled.div`
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 14px;
  padding: 12px 14px;
  display: grid;
  gap: 10px;
`;
const DraftsTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #f59e0b;
  text-transform: uppercase;
`;
const DraftsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;
const DraftChip = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: stretch;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(245,158,11,0.7)' : 'rgba(255,255,255,0.12)')};
  background: ${({ $active }) => ($active ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)')};
  border-radius: 10px;
  overflow: hidden;
`;
const DraftInfo = styled.button`
  display: grid;
  gap: 2px;
  text-align: left;
  border: none;
  background: transparent;
  color: #fff;
  padding: 8px 12px;
  cursor: pointer;
  strong { font-size: 0.9rem; }
  span { font-size: 0.78rem; color: rgba(255,255,255,0.6); }
  &:hover { background: rgba(255,255,255,0.04); }
`;
const DraftDel = styled.button`
  border: none;
  border-left: 1px solid rgba(255,255,255,0.1);
  background: transparent;
  color: rgba(255,255,255,0.5);
  padding: 0 12px;
  cursor: pointer;
  &:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
`;

const InputWrapper = styled.div`
display: flex;
gap: 8px;
    flex-direction: column;
;`
const Label = styled.label`
  display: grid;
  gap: 8px;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.68);
`;
const Page = styled.main`
    display: grid;
    gap: 14px;
    overflow: auto;
    max-height: 90vh;
    width: 100%;
    grid-template-columns: 3fr 1fr;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
`;

const Title = styled.h1`
    margin: 0;
    font-size: 1.7rem;
`;

const MenuItemsSell = styled.section`
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
    @media (max-width: 1100px) {
        grid-template-columns: 1fr;
    }
`;

const Panel = styled.section`
    display: grid;
    gap: 12px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 14px;
`;

const MenuItems = styled.div`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;

    @media (max-width: 1200px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 760px) {
        grid-template-columns: 1fr;
    }
`;

const DishCard = styled.article`
    display: grid;
    gap: 8px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    padding: 10px;
`;

const DishImage = styled.div`
    width: 100%;
    aspect-ratio: 16/10;
    border-radius: 10px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.02);

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;

const DishName = styled.h3`
    margin: 0;
    font-size: 1rem;
`;

const Muted = styled.p`
    margin: 0;
    color: rgba(255, 255, 255, 0.62);
    font-size: 0.9rem;
`;

const Chips = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
`;

const Chip = styled.button<{ $active?: boolean }>`
    border: 1px solid ${({ $active }) => ($active ? 'rgba(141,180,255,0.7)' : 'rgba(255,255,255,0.1)')};
    color: ${({ $active }) => ($active ? '#d9e8ff' : 'rgba(255,255,255,0.72)')};
    background: ${({ $active }) => ($active ? 'rgba(102,146,255,0.2)' : 'rgba(255,255,255,0.04)')};
    border-radius: 999px;
    padding: 8px 14px;
    cursor: pointer;
    font-weight: 600;
`;

const CartList = styled.div`
    display: grid;
    gap: 10px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
`;

const CartRow = styled.div`
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 10px;
`;

const Counter = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 8px;
`;

const CounterBtn = styled.button`
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
    border-radius: 8px;
    width: 24px;
    height: 24px;
    cursor: pointer;
`;

const Totals = styled.div`
    display: grid;
    gap: 8px;
    margin-top: 8px;
`;

const TotalRow = styled.div`
    display: flex;
    justify-content: space-between;
    color: rgba(255, 255, 255, 0.82);
`;

const FooterActions = styled.div`
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-height: 80px;
    margin-top: auto;
    margin-bottom: 24px;
`;

const OrderPanel = styled(Panel)`
    align-self: start;            /* don't stretch to the main column's height */
    position: sticky;
    top: 0;
    max-height: calc(90vh - 28px); /* stay within the scroll container, never grow with main */
    display: flex;
    flex-direction: column;
`


const Main = styled(Panel)`
    margin-right: 24px;

`
const Dropdowns =  styled(Panel)`
    grid-template-columns: 1fr 1fr;
`

const SearchPanel = styled(Panel)`
display: flex;
flex-direction: column;
`
