// Local (per-browser) order drafts — let an operator set an order aside and resume later.
import type { MenuItem } from '@shared/types/Menu';

export type DraftCartItem = MenuItem & { count: number };

export interface OrderDraft {
  id: string;
  createdAt: number;
  updatedAt: number;
  restaurantId: string;
  cart: DraftCartItem[];
  formData: Record<string, string>;
  pickupTime: string;
  deliveryFee: string;
}

const KEY = 'order_center_order_drafts';

const read = (): OrderDraft[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = (drafts: OrderDraft[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(drafts));
  } catch {
    // storage full / disabled — ignore
  }
};

// newest first
export const getDrafts = (): OrderDraft[] => read().sort((a, b) => b.updatedAt - a.updatedAt);

// Upsert by id. Pass an existing id to update that draft, or omit for a new one.
export const saveDraft = (
  draft: Omit<OrderDraft, 'createdAt' | 'updatedAt' | 'id'> & { id?: string },
): OrderDraft => {
  const drafts = read();
  const now = Date.now();
  const id = draft.id || `draft_${now}_${Math.floor(Math.random() * 1e6)}`;
  const existing = drafts.find((d) => d.id === id);
  const next: OrderDraft = {
    id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    restaurantId: draft.restaurantId,
    cart: draft.cart,
    formData: draft.formData,
    pickupTime: draft.pickupTime,
    deliveryFee: draft.deliveryFee,
  };
  write([next, ...drafts.filter((d) => d.id !== id)]);
  return next;
};

export const deleteDraft = (id: string) => {
  write(read().filter((d) => d.id !== id));
};
