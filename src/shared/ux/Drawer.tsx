import { type ReactNode, useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Button } from "@shared/ui/Button";

type DrawerPosition = 'bottom' | 'top';

interface DrawerProps {
  open: boolean;
  position?: DrawerPosition;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  closeOnBackdropClick?: boolean;
}

const Backdrop = styled.div<{ $visible: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(6, 10, 20, 0.72);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  z-index: 1100;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  transition: opacity 220ms ease;
`;

const slideInBottom = keyframes`
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const slideOutBottom = keyframes`
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(100%); opacity: 0; }
`;

const slideInTop = keyframes`
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const slideOutTop = keyframes`
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(-100%); opacity: 0; }
`;

const Panel = styled.div<{ position: DrawerPosition; $visible: boolean }>`
  position: fixed;
  left: 0;
  right: 0;
  ${({ position }) => (position === 'bottom' ? 'bottom: 0;' : 'top: 0;')}
  animation: ${({ position, $visible }) =>
    $visible
      ? position === 'bottom'
        ? slideInBottom
        : slideInTop
      : position === 'bottom'
      ? slideOutBottom
      : slideOutTop} 260ms ease forwards;
  width: 100%;
  max-height: 98vh;
    height: 100%;
  background:  rgba(18, 24, 44, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.35);
  border-radius: ${({ position }) => (position === 'bottom' ? '24px 24px 0 0' : '0 0 24px 24px')};
  overflow: hidden;
  display: grid;
  grid-template-rows: auto;
  padding: 24px;
  will-change: transform, opacity;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  max-height: 80px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
`;

const Content = styled.div`
  overflow: auto;
`;

export const Drawer = ({
  open,
  position = 'bottom',
  title,
  children,
  onClose,
  closeOnBackdropClick = true,
}: DrawerProps) => {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
      return;
    }

    setVisible(false);
    const timeout = window.setTimeout(() => setMounted(false), 260);
    return () => window.clearTimeout(timeout);
  }, [open]);

  if (!mounted) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) onClose();
  };

  return (
    <Backdrop $visible={visible} onClick={handleBackdropClick}>
      <Panel position={position} $visible={visible} onClick={(event) => event.stopPropagation()}>
        <Header>
          <Title>{title ?? 'Drawer'}</Title>
          <Button variant="ghost" onClick={onClose} type="button">
            Փակել
          </Button>
        </Header>
        <Content>{children}</Content>
      </Panel>
    </Backdrop>
  );
};
