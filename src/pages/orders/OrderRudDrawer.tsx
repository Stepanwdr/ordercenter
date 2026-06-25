import { useState } from 'react';
import styled from 'styled-components';
import { Input } from '@shared/ui/Input';
import { Dropdown } from '@shared/ui/Dropdown';
import { Button } from '@shared/ui/Button';
import { Modal } from '@shared/ux/Modal';
import { toast } from 'react-toastify';
import type { Order } from '@shared/types';
import { useUpdateOrderMutation, useDeleteOrderMutation } from '@app/hooks/dataApi';

const orderTypeOptions = [
  { value: 'delivery', label: 'Առաքում' },
  { value: 'takeaway', label: 'Տանելու' },
  { value: 'dine_in', label: 'Տեղում' },
];
const paymentOptions = ['CASH', 'ONLINE', 'BANK-POS', 'IDRAM'].map((m) => ({ value: m, label: m }));
const statusOptions = [
  { value: 'cooking', label: 'Պատրաստվում է' },
  { value: 'ready', label: 'Պատրաստ է' },
  { value: 'enRoute', label: 'Ճանապարհին է' },
  { value: 'done', label: 'Ավարտված' },
];

export function OrderRudDrawer({ order, onClose }: { order: Order; onClose: () => void }) {
  const update = useUpdateOrderMutation();
  const del = useDeleteOrderMutation();
  const [confirmDel, setConfirmDel] = useState(false);
  const [form, setForm] = useState({
    customerName: order.customerName ?? '',
    customerPhone: order.customerPhone ?? '',
    deliveryAddress: order.deliveryAddress ?? '',
    prepTime: order.prepTime ?? '',
    deliveryFee: order.deliveryFee != null ? String(order.deliveryFee) : '',
    orderType: order.orderType ?? 'delivery',
    payMethod: order.payMethod ?? '',
    status: order.status ?? '',
  });
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    try {
      await update.mutateAsync({
        id: order.id,
        payload: {
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          deliveryAddress: form.deliveryAddress,
          prepTime: form.prepTime,
          deliveryFee: Number(form.deliveryFee) || 0,
          orderType: form.orderType,
          ...(form.payMethod ? { payMethod: form.payMethod } : {}),
          ...(form.status ? { status: form.status } : {}),
        },
      });
      toast.success('Պատվերը թարմացվեց');
      onClose();
    } catch {
      toast.error('Չհաջողվեց պահել');
    }
  };

  const remove = async () => {
    try {
      await del.mutateAsync(order.id);
      toast.success('Պատվերը ջնջվեց');
      setConfirmDel(false);
      onClose();
    } catch {
      toast.error('Չհաջողվեց ջնջել');
    }
  };

  return (
    <Wrap>
      <Title>#{order.code}</Title>
      <Meta>
        {order.restaurant?.name}
        {order.branch?.name ? ` · ${order.branch.name}` : ''} · {new Date(order.createdAt).toLocaleString('ru-RU')}
      </Meta>

      <Grid>
        <Field>
          <L>Հաճախորդ</L>
          <Input value={form.customerName} onChange={(e) => set('customerName', e.target.value)} placeholder="Անուն" />
        </Field>
        <Field>
          <L>Հեռախոս</L>
          <Input value={form.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} placeholder="Հեռախոս" />
        </Field>
      </Grid>
      <Field>
        <L>Հասցե</L>
        <Input value={form.deliveryAddress} onChange={(e) => set('deliveryAddress', e.target.value)} placeholder="Հասցե" />
      </Field>
      <Grid>
        <Field>
          <L>Տրման ժամ</L>
          <Input value={form.prepTime} onChange={(e) => set('prepTime', e.target.value)} placeholder="--:--" />
        </Field>
        <Field>
          <L>Առաքման գումար</L>
          <Input value={form.deliveryFee} onChange={(e) => set('deliveryFee', e.target.value)} placeholder="0" />
        </Field>
      </Grid>
      <Grid>
        <Field>
          <L>Ստացման եղանակ</L>
          <Dropdown value={form.orderType} options={orderTypeOptions} placeholder="—" triggerDisplay="chip" onChange={(v) => set('orderType', v || 'delivery')} />
        </Field>
        <Field>
          <L>Վճարում</L>
          <Dropdown value={form.payMethod} options={paymentOptions} placeholder="—" triggerDisplay="chip" onChange={(v) => set('payMethod', v)} />
        </Field>
      </Grid>
      <Field>
        <L>Կարգավիճակ</L>
        <Dropdown value={form.status} options={statusOptions} placeholder="—" triggerDisplay="chip" onChange={(v) => set('status', v)} />
      </Field>

      <ItemsTitle>Պատվեր</ItemsTitle>
      <Items>
        {(order.orderItems ?? []).map((it, i) => (
          <li key={it.id ?? i}>
            <span>{it.quantity}× {it.menuItem?.name ?? it.name ?? '—'}</span>
            <b>{(Number(it.price) * it.quantity).toFixed(2)}</b>
          </li>
        ))}
      </Items>
      <Total>Ընդամենը՝ {Number(order.price).toFixed(2)}</Total>

      <Actions>
        <Button type="button" variant="ghost" onClick={() => setConfirmDel(true)}>🗑 Ջնջել</Button>
        <Spacer />
        <Button type="button" variant="secondary" onClick={onClose}>Չեղարկել</Button>
        <Button type="button" onClick={save} disabled={update.isPending}>{update.isPending ? '...' : 'Պահել'}</Button>
      </Actions>

      {confirmDel && (
        <Modal title="Ջնջել պատվերը" width="min(420px, 100%)" onClose={() => setConfirmDel(false)}>
          <div>«#{order.code}» պատվերը ջնջե՞լ։ Գործողությունն անշրջելի է։</div>
          <ModActions>
            <Button type="button" variant="secondary" onClick={() => setConfirmDel(false)}>Չեղարկել</Button>
            <Button type="button" onClick={remove} disabled={del.isPending}>{del.isPending ? '...' : 'Ջնջել'}</Button>
          </ModActions>
        </Modal>
      )}
    </Wrap>
  );
}

const Wrap = styled.div`
  display: grid;
  gap: 14px;
  max-width: 720px;
  margin: 0 auto;
`;
const Title = styled.h2`
  margin: 0;
`;
const Meta = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;
const Field = styled.label`
  display: grid;
  gap: 6px;
`;
const L = styled.span`
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.6);
`;
const ItemsTitle = styled.h3`
  margin: 8px 0 0;
  font-size: 1rem;
`;
const Items = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
  li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: rgba(255, 255, 255, 0.85);
  }
`;
const Total = styled.div`
  text-align: right;
  font-weight: 800;
`;
const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
`;
const Spacer = styled.span`
  flex: 1;
`;
const ModActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;
