import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { useOrdersStore } from '@store/ordersStore';
import type {OrderAddress, OrderItem} from "@entities/order/types.ts";
import {Dropdown} from "@shared/ui/Dropdown.tsx";

const restaurants = [
  { value: 'rest-1', label: 'Kinetic Kitchen', eta: '18 min', rating: 4.9 },
  { value: 'rest-2', label: 'Slate Noodles', eta: '14 min', rating: 4.7 },
  { value: 'rest-3', label: 'Glass Grill', eta: '20 min', rating: 4.8 },
];

const menuOptions = [
  { id: 'm1', name: 'Energize Latte', category: 'Drinks', price: 5.5, description: 'Velvety oat milk latte' },
  { id: 'm2', name: 'Dragon Bowl', category: 'Food', price: 12.95, description: 'Supergreens with tofu' },
  { id: 'm3', name: 'Prime Rib', category: 'Meat', price: 18.5, description: 'Black pepper crusted ribeye' },
  { id: 'm4', name: 'Citrus Spritz', category: 'Drinks', price: 6.95, description: 'Sparkling citrus mix' },
  { id: 'm5', name: 'Noodle Stir Fry', category: 'Food', price: 11.5, description: 'House vegetables and noodles' },
];

const DrawerLayout = styled.div`
    display: grid;
    grid-template-columns: minmax(320px, 1.25fr) minmax(300px, 0.75fr);
    gap: 24px;
`;

const Panel = styled.div`
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 28px;
    padding: 24px;
    min-height: 560px;
`;

const FieldGroup = styled.div`
    display: grid;
    gap: 14px;
    margin-bottom: 18px;
`;

const Label = styled.label`
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.75);
`;

const SectionTitle = styled.h3`
    margin: 0 0 16px;
    font-size: 1.1rem;
`;

const MenuGrid = styled.div`
    display: grid;
    gap: 14px;
`;

const MenuCard = styled.div`
    padding: 16px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
    display: grid;
    gap: 10px;
`;

const Toggle = styled.button<{ active?: boolean }>`
    border: none;
    background: ${({ active }) => (active ? 'rgba(79, 143, 255, 0.2)' : 'rgba(255,255,255,0.04)')};
    color: ${({ active }) => (active ? '#fff' : 'rgba(255,255,255,0.72)')};
    border-radius: 999px;
    padding: 10px 16px;
    font-weight: 700;
`;

const CartPanel = styled(Panel)`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const CartSummary = styled.div`
    display: grid;
    gap: 14px;
`;

const menuCategories = ['Drinks', 'Food', 'Meat'] as const;

export const CreateOrderForm = ({ onClose }: { onClose: () => void }) => {
  const [activeCategory, setActiveCategory] = useState<typeof menuCategories[number]>('Drinks');
  const [restaurant, setRestaurant] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<OrderAddress>({ city: '', street: '', building: '', apartment: '', comment: '' });
  const [items, setItems] = useState<OrderItem[]>([]);

  const createOrder = useOrdersStore((state) => state.createOrder);
  const loading = useOrdersStore((state) => state.loading);

  const filteredMenu = useMemo(
    () => menuOptions.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = (menuItem: typeof menuOptions[number]) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: menuItem.id, name: menuItem.name, quantity: 1, price: menuItem.price }];
    });
  };

  const handleSubmit = async () => {
    await createOrder({
      orderCode: `ORD-${Math.floor(Math.random() * 9000) + 1000}`,
      customerName,
      phone,
      restaurant,
      totalAmount: cartTotal,
      status: 'new',
      createdAt: new Date().toISOString(),
      items,
      address,
    });
    onClose();
  };

  return (
    <DrawerLayout>
      <Panel>
        <SectionTitle>Նոր պատվեր</SectionTitle>
        <FieldGroup>
          <Label>Ռեստորան</Label>
          <Dropdown
            value={restaurant}
            options={restaurants}
            placeholder="Ընրել ռեստորանը"
            onChange={(value) => setRestaurant(value)}
          />
        </FieldGroup>

        <FieldGroup>
          <Label>Պատվիրատու</Label>
          <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
        </FieldGroup>

        <FieldGroup>
          <Label>Հասցե</Label>
          <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="City" />
          <Input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} placeholder="Street" />
          <Input value={address.building} onChange={(e) => setAddress({ ...address, building: e.target.value })} placeholder="Building" />
          <Input value={address.apartment} onChange={(e) => setAddress({ ...address, apartment: e.target.value })} placeholder="Apartment" />
          <Input value={address.comment} onChange={(e) => setAddress({ ...address, comment: e.target.value })} placeholder="Comment" />
        </FieldGroup>

        <SectionTitle>Menu</SectionTitle>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {menuCategories.map((category) => (
            <Toggle key={category} type="button" active={activeCategory === category} onClick={() => setActiveCategory(category)}>
              {category}
            </Toggle>
          ))}
        </div>
        <MenuGrid>
          {filteredMenu.map((item) => (
            <MenuCard key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <p style={{ margin: '6px 0', color: 'rgba(255,255,255,0.7)' }}>{item.description}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>${item.price.toFixed(2)}</span>
                <Button type="button" onClick={() => addItem(item)}>Ավելացնել</Button>
              </div>
            </MenuCard>
          ))}
        </MenuGrid>
      </Panel>
      <CartPanel>
        <SectionTitle>Պատվերի յամբուղ</SectionTitle>
        <CartSummary>
          {items.length === 0 ? (
            <p>Ավելացնել :</p>
          ) : (
            items.map((item) => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                <div>
                  <strong>{item.name}</strong>
                  <p style={{ margin: '6px 0', color: 'rgba(255,255,255,0.65)' }}>Qty {item.quantity}</p>
                </div>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))
          )}
        </CartSummary>
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span>Գումարը</span>
            <strong>${cartTotal.toFixed(2)}</strong>
          </div>
          <Button onClick={handleSubmit} disabled={loading || items.length === 0 || !customerName || !phone}>
            {loading ? 'Ստեղվանոր՛' : 'Ստեղծել պատվեր'}
          </Button>
        </div>
      </CartPanel>
    </DrawerLayout>
  );
};
