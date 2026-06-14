import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export interface KdsOrderItem {
  id: string;
  name: string | null;
  quantity: number;
  price: number;
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

type ConnState = 'connecting' | 'online' | 'offline';

/**
 * Subscribes the kitchen tablet to its restaurant's SSE order stream.
 * - newest orders first
 * - connection indicator + automatic reconnect (incl. after fatal close)
 * - heartbeats (`: ping` comment lines) are ignored natively by EventSource
 */
export function useOrderStream(restaurantId?: string, token?: string) {
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [conn, setConn] = useState<ConnState>('connecting');
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);

  const removeOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const connect = useCallback(() => {
    if (!restaurantId) return;
    // tear down any previous stream
    esRef.current?.close();

    const qs = token ? `?token=${encodeURIComponent(token)}` : '';
    const es = new EventSource(`${API_BASE}/kitchen/restaurants/${restaurantId}/stream${qs}`);
    esRef.current = es;
    setConn('connecting');

    es.onopen = () => {
      attemptsRef.current = 0;
      setConn('online');
    };

    // new order -> prepend (newest on top), dedupe by id (replay re-sends on reconnect)
    es.addEventListener('order:new', (e) => {
      try {
        const order: KdsOrder = JSON.parse((e as MessageEvent).data);
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
  }, [restaurantId, token, removeOrder]);

  useEffect(() => {
    connect();
    return () => {
      if (retryRef.current) window.clearTimeout(retryRef.current);
      esRef.current?.close();
    };
  }, [connect]);

  return { orders, conn, removeOrder };
}

/** Kitchen "Принял": acknowledge an order (device-token auth, advances order status). */
export async function acceptOrder(restaurantId: string, orderId: string, token?: string) {
  const res = await fetch(`${API_BASE}/kitchen/restaurants/${restaurantId}/ack`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-device-token': token } : {}),
    },
    body: JSON.stringify({ orderId, status: 'accepted' }),
  });
  if (!res.ok) throw new Error(`ack failed: ${res.status}`);
  return res.json();
}
