import styled from 'styled-components';
import { type ReactNode } from 'react';
import {Button} from "@shared/ui/Button.tsx";

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(6, 10, 20, 0.72);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  z-index: 1000;
`;

const Panel = styled.div`
  width: min(1100px, 100%);
  max-height: calc(100vh - 64px);
  overflow: auto;
  background: rgba(18, 24, 44, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.35);
  padding: 28px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 22px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.35rem;
`;

const Body = styled.div`
  display: grid;
  gap: 20px;
`;

export const Modal = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) => (
  <Backdrop onClick={onClose}>
    <Panel onClick={(event) => event.stopPropagation()}>
      <Header>
        <Title>{title}</Title>
        <Button variant="ghost" onClick={onClose}>Փակել</Button>
      </Header>
      <Body>{children}</Body>
    </Panel>
  </Backdrop>
);
