import { useEffect, useRef } from 'react';

/**
 * Returns a ref; invokes `handler` when a pointer-down happens outside the ref'd
 * element. Only active while `active` is true (e.g. while a popover is open).
 */
export function useOutsideClick<T extends HTMLElement>(handler: () => void, active = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) handler();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [handler, active]);

  return ref;
}
