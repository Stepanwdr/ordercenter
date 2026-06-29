import { useCallback, useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { playSound } from '@shared/lib/sound';

type Note = {
  id: number;
  title: string;
  body: string;
  restaurant?: string;
  branch?: string;
  logo?: string;
  leaving?: boolean;
};

let seq = 0;

// Custom sound: drop a file at `public/sounds/order-accepted.mp3`, or set
// VITE_NOTIFICATION_SOUND to any URL. Missing/blocked → falls back to a generated chime.
const SOUND_URL = (import.meta.env.VITE_NOTIFICATION_SOUND as string | undefined) ?? '/sounds/order-accepted.mp3';

const API_IMG_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5000';
const resolveImg = (u?: string | null) =>
  !u ? '' : u.startsWith('http') || u.startsWith('//') ? u : `${API_IMG_BASE}${u}`;

export function LiveNotifications() {
  const [notes, setNotes] = useState<Note[]>([]);

  const dismiss = useCallback((id: number) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, leaving: true } : n)));
    window.setTimeout(() => setNotes((prev) => prev.filter((n) => n.id !== id)), 300);
  }, []);

  useEffect(() => {
    const onAccepted = (e: Event) => {
      const order = ((e as CustomEvent).detail || {}) as {
        code?: string;
        customerName?: string;
        restaurant?: { name?: string; logo?: string | null };
        branch?: { name?: string; address?: string };
      };
      const id = ++seq;
      const code = order.code ? `#${order.code}` : 'Պատվեր';
      const who = order.customerName ? ` · ${order.customerName}` : '';
      const note: Note = {
        id,
        title: '🍳 Խոհանոցն ընդունեց պատվերը',
        body: `${code}${who} — Պատրաստվում է`,
        restaurant: order.restaurant?.name || undefined,
        branch: order.branch?.name || order.branch?.address || undefined,
        logo: order.restaurant?.logo || undefined,
      };
      setNotes((prev) => [note, ...prev].slice(0, 5));
      playSound(SOUND_URL, [880, 1175]);
      window.setTimeout(() => dismiss(id), 6000);
    };
    window.addEventListener('live:order-accepted', onAccepted);
    return () => window.removeEventListener('live:order-accepted', onAccepted);
  }, [dismiss]);

  if (!notes.length) return null;

  return (
    <Stack>
      {notes.map((n) => (
        <Card key={n.id} $leaving={n.leaving} onClick={() => dismiss(n.id)} role="alert">
          <Accent />
          {n.logo ? <Logo src={resolveImg(n.logo)} alt={n.restaurant || ''} /> : <LogoFallback>🍽️</LogoFallback>}
          <Texts>
            <Title>{n.title}</Title>
            {(n.restaurant || n.branch) && (
              <Place>
                {n.restaurant}
                {n.branch ? <Branch> · 🏬 {n.branch}</Branch> : null}
              </Place>
            )}
            <Body>{n.body}</Body>
          </Texts>
          <Close aria-label="close" onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}>✕</Close>
        </Card>
      ))}
    </Stack>
  );
}

const slideIn = keyframes`
  from { transform: translateX(120%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;
const slideOut = keyframes`
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(120%); opacity: 0; }
`;

const Stack = styled.div`
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 3000;
  display: grid;
  gap: 10px;
  width: min(360px, calc(100vw - 36px));
  pointer-events: none;
`;

const Card = styled.div<{ $leaving?: boolean }>`
  pointer-events: auto;
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 12px;
  padding: 14px 14px 14px 16px;
  border-radius: 16px;
  background: rgba(18, 24, 44, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 22px 48px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  overflow: hidden;
  animation: ${({ $leaving }) => ($leaving ? slideOut : slideIn)} 280ms ease forwards;
`;

const Accent = styled.span`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #34d399, #4f8fff);
`;

const Logo = styled.img`
  width: 42px;
  height: 42px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
`;
const LogoFallback = styled.span`
  width: 42px;
  height: 42px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
`;
const Place = styled.span`
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
`;
const Branch = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
`;

const Texts = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;
`;

const Title = styled.strong`
  color: #fff;
  font-size: 0.95rem;
`;

const Body = styled.span`
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.88rem;
`;

const Close = styled.button`
  margin-left: auto;
  align-self: flex-start;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 14px;
  &:hover { color: #fff; }
`;
