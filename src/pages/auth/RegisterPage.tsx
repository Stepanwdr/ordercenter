import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthProvider';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Description, Field, Footer, Form, Header, Hint, PageRoot, Panel, TextLink, Title } from './authStyles';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Fill in all fields to create your account');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      register(name.trim(), email.trim(), password.trim());
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create account');
    }
  };

  return (
    <PageRoot>
      <Panel>
        <Header>
          <Title>Create your account</Title>
          <Description>Register a new OrderCenter profile to start managing dispatching and delivery operations.</Description>
        </Header>

        <Form onSubmit={handleSubmit}>
          <Field>
            Full name
            <Input
              value={name}
              placeholder="Alex Morgan"
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          <Field>
            Email
            <Input
              type="email"
              value={email}
              placeholder="example@ordercenter.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          <Field>
            Password
            <Input
              type="password"
              value={password}
              placeholder="Create a strong password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          <Field>
            Confirm password
            <Input
              type="password"
              value={confirmPassword}
              placeholder="Repeat your password"
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </Field>

          {error && <Hint $tone="error">{error}</Hint>}

          <Button type="submit">Create account</Button>
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
