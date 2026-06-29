import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export interface KdsOrderItem {
  id: string;
  name: string | null;
  quantity: number;
  price: number;
  note?: string | null;
  modifiers?: (string | { name: string })[];
}

export interface KdsOrder {
  id: string;
  code: string;
  status: string;
  orderType?: string;
  createdAt: string;
  customer?: { name?: string; phone?: string };
  delivery?: { address?: string; comment?: string; fee?: number };
  payment?: { method?: string; paid?: boolean };
  items: KdsOrderItem[];
  total: number;
}

/** Identity of the kitchen's scope, shown in the KDS header (restaurant brand + branch). */
export interface KdsScopeInfo {
  scopeKind: KdsScopeKind;
  id: string;
  name: string;
  address?: string | null;
  restaurantName?: string | null;
  logo?: string | null;
}

type ConnState = 'connecting' | 'online' | 'offline';

/**
 * Subscribes the kitchen tablet to its restaurant's SSE order stream.
 * - newest orders first
 * - connection indicator + automatic reconnect (incl. after fatal close)
 * - heartbeats (`: ping` comment lines) are ignored natively by EventSource
 */
export type KdsScopeKind = 'restaurants' | 'branches';

export function useOrderStream(scopeKind: KdsScopeKind = 'restaurants', id?: string, token?: string, onNewOrder?: () => void) {
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [conn, setConn] = useState<ConnState>('connecting');
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);
  // Keep the callback in a ref so it never re-subscribes the stream.
  const onNewOrderRef = useRef(onNewOrder);
  onNewOrderRef.current = onNewOrder;
  // Ids we've already shown — so a reconnect replay never re-sounds.
  const seenRef = useRef<Set<string>>(new Set());
  // Suppress the sound during the initial replay burst right after (re)connect.
  const readyRef = useRef(false);

  const removeOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const connect = useCallback(() => {
    if (!id) return;
    // tear down any previous stream
    esRef.current?.close();

    const qs = token ? `?token=${encodeURIComponent(token)}` : '';
    const es = new EventSource(`${API_BASE}/kitchen/${scopeKind}/${id}/stream${qs}`);
    esRef.current = es;
    setConn('connecting');

    es.onopen = () => {
      attemptsRef.current = 0;
      setConn('online');
      // Replay of existing pending orders arrives now — don't sound for those.
      readyRef.current = false;
      window.setTimeout(() => { readyRef.current = true; }, 1500);
    };

    // new order -> prepend (newest on top), dedupe by id (replay re-sends on reconnect)
    es.addEventListener('order:new', (e) => {
      try {
        const order: KdsOrder = JSON.parse((e as MessageEvent).data);
        const isNew = !seenRef.current.has(order.id);
        seenRef.current.add(order.id);
        if (isNew && readyRef.current) onNewOrderRef.current?.(); // genuinely new → sound
        setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
      } catch {
        /* ignore malformed */
      }
    });

    es.addEventListener('order:cancel', (e) => {
      try {
        const { id } = JSON.parse((e as MessageEvent).data);
        removeOrder(id);
      } catch {
        /* ignore */
      }
    });

    es.onerror = () => {
      // EventSource auto-reconnects while readyState===CONNECTING, but on a fatal
      // close (e.g. 401/404) it stays CLOSED — reconnect ourselves with backoff.
      setConn('offline');
      if (es.readyState === EventSource.CLOSED) {
        es.close();
        const delay = Math.min(15000, 1000 * 2 ** attemptsRef.current);
        attemptsRef.current += 1;
        retryRef.current = window.setTimeout(connect, delay);
      }
    };
  }, [scopeKind, id, token, removeOrder]);

  useEffect(() => {
    connect();
    return () => {
      if (retryRef.current) window.clearTimeout(retryRef.current);
      esRef.current?.close();
    };
  }, [connect]);

  return { orders, conn, removeOrder };
}

/** Load the scope's identity (restaurant name + logo, branch name + address) for the header. */
export async function fetchScopeInfo(
  scopeKind: KdsScopeKind,
  id: string,
  token?: string,
): Promise<KdsScopeInfo | null> {
  const qs = token ? `?token=${encodeURIComponent(token)}` : '';
  const res = await fetch(`${API_BASE}/kitchen/${scopeKind}/${id}/info${qs}`);
  if (!res.ok) return null;
  const json = await res.json();
  return (json?.data as KdsScopeInfo) ?? null;
}

/** Acknowledge an order at the kitchen (device-token auth, advances order status). */
async function ackOrder(scopeKind: KdsScopeKind, id: string, orderId: string, status: 'accepted' | 'ready', token?: string) {
  const res = await fetch(`${API_BASE}/kitchen/${scopeKind}/${id}/ack`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-device-token': token } : {}),
    },
    body: JSON.stringify({ orderId, status }),
  });
  if (!res.ok) throw new Error(`ack failed: ${res.status}`);
  return res.json();
}

/** Kitchen "Принял": started preparing → order moves to 'cooking'. */
export const acceptOrder = (scopeKind: KdsScopeKind, id: string, orderId: string, token?: string) =>
  ackOrder(scopeKind, id, orderId, 'accepted', token);

/** Kitchen "Готово": finished cooking → order moves to 'ready'. */
export const readyOrder = (scopeKind: KdsScopeKind, id: string, orderId: string, token?: string) =>
  ackOrder(scopeKind, id, orderId, 'ready', token);
