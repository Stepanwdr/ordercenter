import { Link } from 'react-router-dom';
import styled from 'styled-components';

export const PageRoot = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: radial-gradient(circle at top left, rgba(74, 84, 169, 0.18), transparent 30%), #090b11;
`;

export const Panel = styled.section`
  width: min(100%, 420px);
  padding: 42px 36px;
  border-radius: 30px;
  background: rgba(14, 20, 40, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.24);
`;

export const Header = styled.div`
  display: grid;
  gap: 8px;
  margin-bottom: 32px;
`;

export const Title = styled.h1`
  margin: 0;
  font-size: 2rem;
  letter-spacing: -0.03em;
`;

export const Description = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.7;
`;

export const Form = styled.form`
  display: grid;
  gap: 20px;
`;

export const Field = styled.label`
  display: grid;
  gap: 10px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

export const Hint = styled.span<{ $tone?: 'error' | 'muted' }>`
  color: ${({ $tone }) => ($tone === 'error' ? '#fda4af' : 'rgba(255, 255, 255, 0.6)')};
  font-size: 0.95rem;
  line-height: 1.5;
`;

export const Footer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 24px;
`;

export const TextLink = styled(Link)`
  color: #8bc5ff;
  text-decoration: none;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;
