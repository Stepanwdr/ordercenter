import {type FormEvent, useMemo} from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Description, Field, Footer, Form, Header, Hint, PageRoot, Panel, TextLink, Title } from './authStyles';
import type { UserRole } from '@shared/types';
import { registerSchema } from '@app/validation/registerSchema';
import { toast } from 'react-toastify';
import {Dropdown} from "@shared/ui/Dropdown.tsx";
import { useRegisterMutation } from '@app/hooks/authApi';

export const RegisterPage = () => {
  const [role, setRole] = useState<UserRole>('operator');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Fill in all fields to create your account');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Client-side schema validation
    try {
      registerSchema.parse({ name: name.trim(), email: email.trim(), password: password.trim(), role });
    } catch (e) {
      const err = e as any;
      const message = err?.issues?.[0]?.message || err?.message || 'Invalid form data';
      toast.error(message);
      setError(message);
      return;
    }

    try {
      const authData = await registerMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
      });

      localStorage.setItem(
        'order_center_user',
        JSON.stringify({
          id: authData.user.id,
          email: authData.user.email,
          role: authData.user.role,
          name: name.trim(),
        })
      );
      localStorage.setItem('order_center_access_token', authData.accessToken);
      localStorage.setItem('order_center_refresh_token', authData.refreshToken);
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create account');
    }
  };
const rolesOption =[{
  value: 'admin',
  label: 'Administrator',
  },
  {
    value:'courier',
    label:'Առաքիչ'
  },
  {
    value:'operator',
    label:'Օպեռատոր'
  }
]
  return (
    <PageRoot>
      <Panel>
        <Header>
          <Title>Ստեղծել հաշիվ</Title>
        </Header>
        <Form onSubmit={handleSubmit}>
          <Field>
            Role
            <Dropdown
              value={role}
              options={rolesOption}
              placeholder="Role"
              onChange={(value) => setRole(value as UserRole)}
              triggerDisplay="chip"
            />
          </Field>
          <Field>
           Անուն Ազգանուն
            <Input
              value={name}
              placeholder="Alex Morgan"
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          <Field>
            Էլ․ Հասցե
            <Input
              type="email"
              value={email}
              placeholder="example@ordercenter.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          <Field>
            Գաղտնաբառ
            <Input
              type="password"
              value={password}
              placeholder="Create a strong password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          <Field>
            Հաստատել գաղտնաբառը
            <Input
              type="password"
              value={confirmPassword}
              placeholder="Repeat your password"
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </Field>

          {error && <Hint $tone="error">{error}</Hint>}

          <Button type="submit" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? 'Creating...' : 'Create account'}
          </Button>
        </Form>

        <Footer>
          <Hint>
            Already have an account? <TextLink to="/login">Sign in</TextLink>
          </Hint>
        </Footer>
      </Panel>
    </PageRoot>
  );
};
