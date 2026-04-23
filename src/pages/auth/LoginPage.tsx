import {type FormEvent, useEffect} from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthProvider';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { Description, Field, Footer, Form, Header, Hint, PageRoot, Panel, TextLink, Title } from './authStyles';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password');
      return;
    }

    try {
      login(email.trim(), password.trim());
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to sign in');
    }
  };

  useEffect(() => {

  }, []);

  return (
    <PageRoot>
      <Panel>
        <Header>
          <Title>Sign in to OrderCenter</Title>
          <Description>Use your account credentials to access orders, couriers, restaurants, and settings.</Description>
        </Header>

        <Form onSubmit={handleSubmit}>
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
              placeholder="password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          {error && <Hint $tone="error">{error}</Hint>}

          <Button type="submit">Sign in</Button>
        </Form>

        <Footer>
          <Hint>
            No account yet? <TextLink to="/register">Create one</TextLink>
          </Hint>
        </Footer>
      </Panel>
    </PageRoot>
  );
};
