import { useState } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useAuth } from '@app/providers/AuthProvider';
import { useUsersQuery, useCreateUserMutation, useRestaurantsQuery, useUpdateUserPasswordMutation } from '@app/hooks/dataApi';
import { Dropdown } from '@shared/ui/Dropdown';
import type { UserRole } from '@shared/types/User';

// Roles that can be created from the Settings page.
const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Администратор' },
  { value: 'operator', label: 'Оператор' },
  { value: 'dispatcher', label: 'Диспетчер' },
  { value: 'manager', label: 'Руководитель ресторана' },
];
const ROLE_LABEL: Record<string, string> = {
  admin: 'Администратор',
  operator: 'Оператор',
  manager: 'Руководитель',
  dispatcher: 'Диспетчер',
  courier: 'Курьер',
  customer: 'Клиент',
};
const ROLE_COLOR: Record<string, string> = {
  admin: '#ef4444',
  operator: '#4f8fff',
  manager: '#34d399',
  dispatcher: '#f59e0b',
  courier: '#9d7cff',
  customer: '#64748b',
};

const EMPTY = { name: '', email: '', password: '', role: 'operator' as UserRole, restaurantId: '' };

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: usersResp, isPending } = useUsersQuery();
  const users = usersResp?.data ?? [];
  const createUser = useCreateUserMutation();
  const { data: restaurantsResp } = useRestaurantsQuery();
  const restaurantOptions = (restaurantsResp?.data ?? []).map((r) => ({ value: r.id, label: r.name }));
  const [form, setForm] = useState(EMPTY);
  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Inline password change for a user (admin only).
  const updatePw = useUpdateUserPasswordMutation();
  const [pwFor, setPwFor] = useState<string | null>(null);
  const [pwValue, setPwValue] = useState('');
  const savePw = async (id: string) => {
    if (pwValue.length < 8) {
      toast.error('Пароль минимум 8 символов');
      return;
    }
    try {
      await updatePw.mutateAsync({ id, password: pwValue });
      toast.success('Пароль изменён');
      setPwFor(null);
      setPwValue('');
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось изменить пароль');
    }
  };

  const submit = async () => {
    if (!form.email.trim() || form.password.length < 8) {
      toast.error('Укажите email и пароль (мин. 8 символов)');
      return;
    }
    if (form.role === 'manager' && !form.restaurantId) {
      toast.error('Выберите ресторан для руководителя');
      return;
    }
    try {
      await createUser.mutateAsync({
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        name: form.name.trim() || undefined,
        restaurantId: form.role === 'manager' ? form.restaurantId : undefined,
      });
      toast.success('Пользователь добавлен');
      setForm(EMPTY);
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось создать пользователя');
    }
  };

  return (
    <PageRoot>
      <Header>
        <Title>Настройки</Title>
        <Subtitle>Управление администраторами системы</Subtitle>
      </Header>

      <Cards>
        {isAdmin && (
          <Card>
            <CardTitle>Добавить пользователя</CardTitle>
            <Field>
              <L>Имя</L>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Имя (необязательно)" />
            </Field>
            <Field>
              <L>Email</L>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="user@example.com" />
            </Field>
            <Field>
              <L>Пароль</L>
              <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="минимум 8 символов" />
            </Field>
            <Field>
              <L>Роль</L>
              <Dropdown
                value={form.role}
                options={ROLE_OPTIONS}
                placeholder="Роль"
                onChange={(v) => set('role', v as UserRole)}
              />
            </Field>
            {form.role === 'manager' && (
              <Field>
                <L>Ресторан</L>
                <Dropdown
                  value={form.restaurantId}
                  options={restaurantOptions}
                  placeholder="Выберите ресторан"
                  onChange={(v) => set('restaurantId', v)}
                />
              </Field>
            )}
            <AddBtn onClick={submit} disabled={createUser.isPending}>
              {createUser.isPending ? '…' : '+ Добавить'}
            </AddBtn>
          </Card>
        )}

        <Card>
          <CardTitle>Пользователи{users.length ? ` (${users.length})` : ''}</CardTitle>
          {isPending ? (
            <Muted>Загрузка…</Muted>
          ) : users.length === 0 ? (
            <Muted>Пользователей нет</Muted>
          ) : (
            <UserList>
              {users.map((u) => (
                <UserItem key={u.id}>
                  <UserRow>
                    <div>
                      <UserName>{u.name || u.email || '—'}</UserName>
                      {u.email && u.name && <UserEmail>{u.email}</UserEmail>}
                      {u.role === 'manager' && ((u as any).ownedRestaurants?.length > 0) && (
                        <UserEmail>🏪 {(u as any).ownedRestaurants.map((r: any) => r.name).join(', ')}</UserEmail>
                      )}
                    </div>
                    <RowRight>
                      <RoleChip $color={ROLE_COLOR[u.role || ''] || '#64748b'}>
                        {ROLE_LABEL[u.role || ''] || u.role}
                      </RoleChip>
                      {isAdmin && (
                        <IconBtn
                          type="button"
                          title="Сменить пароль"
                          onClick={() => { setPwFor(pwFor === u.id ? null : u.id); setPwValue(''); }}
                        >
                          🔑
                        </IconBtn>
                      )}
                    </RowRight>
                  </UserRow>
                  {isAdmin && pwFor === u.id && (
                    <PwEditor>
                      <Input
                        type="password"
                        value={pwValue}
                        onChange={(e) => setPwValue(e.target.value)}
                        placeholder="Новый пароль (мин. 8)"
                        autoFocus
                      />
                      <SmallBtn onClick={() => savePw(u.id)} disabled={updatePw.isPending}>
                        {updatePw.isPending ? '…' : 'Сохранить'}
                      </SmallBtn>
                      <SmallBtn $ghost type="button" onClick={() => setPwFor(null)}>Отмена</SmallBtn>
                    </PwEditor>
                  )}
                </UserItem>
              ))}
            </UserList>
          )}
          {!isAdmin && <Muted style={{ marginTop: 12 }}>Добавлять пользователей может только администратор.</Muted>}
        </Card>
      </Cards>
    </PageRoot>
  );
}

const PageRoot = styled.main`
  min-height: 100vh;
  padding: 32px;
  box-sizing: border-box;
  width: 100%;
  max-width: 1100px;
`;
const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 28px;
`;
const Title = styled.h1` margin: 0; font-size: 2rem; `;
const Subtitle = styled.p` margin: 0; color: rgba(255, 255, 255, 0.72); `;
const Cards = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
  align-items: start;
  @media (max-width: 800px) { grid-template-columns: 1fr; }
`;
const Card = styled.section`
  padding: 22px;
  border-radius: 20px;
  background: rgba(18, 24, 44, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: grid;
  gap: 14px;
`;
const CardTitle = styled.h2` margin: 0; font-size: 1.15rem; `;
const Field = styled.label` display: grid; gap: 6px; `;
const L = styled.span` font-size: 0.82rem; color: rgba(255, 255, 255, 0.6); `;
const inputCss = `
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px;
  color: #fff; padding: 11px 13px; font-size: 15px; width: 100%; box-sizing: border-box;
`;
const Input = styled.input` ${inputCss} `;
const AddBtn = styled.button`
  border: none; border-radius: 12px; padding: 12px; cursor: pointer; font-weight: 700; font-size: 15px;
  background: linear-gradient(135deg, #5d7bff, #34d399); color: #fff;
  &:disabled { opacity: 0.6; cursor: default; }
`;
const Muted = styled.div` color: rgba(255,255,255,0.55); font-size: 0.9rem; `;
const UserList = styled.div` display: grid; gap: 8px; `;
const UserItem = styled.div`
  border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03);
`;
const UserRow = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 12px;
`;
const RowRight = styled.div` display: flex; align-items: center; gap: 8px; `;
const IconBtn = styled.button`
  border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); border-radius: 8px;
  padding: 4px 8px; cursor: pointer; font-size: 14px; line-height: 1;
`;
const PwEditor = styled.div`
  display: flex; gap: 8px; align-items: center; padding: 0 12px 12px;
`;
const SmallBtn = styled.button<{ $ghost?: boolean }>`
  border: none; border-radius: 9px; padding: 9px 14px; cursor: pointer; font-weight: 700; font-size: 13px; white-space: nowrap;
  background: ${({ $ghost }) => ($ghost ? 'rgba(255,255,255,0.08)' : '#4f8fff')};
  color: #fff;
  &:disabled { opacity: 0.6; cursor: default; }
`;
const UserName = styled.div` font-weight: 600; `;
const UserEmail = styled.div` font-size: 0.8rem; color: rgba(255,255,255,0.55); `;
const RoleChip = styled.span<{ $color: string }>`
  padding: 4px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 700; white-space: nowrap;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}22`};
  border: 1px solid ${({ $color }) => `${$color}55`};
`;
