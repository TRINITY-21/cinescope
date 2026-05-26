import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Desktop: open on hover with enter/leave delays; keyboard: focus-within.
 * Touch: toggle via onToggleClick only.
 */
export function useHoverMenu({ openDelay = 80, closeDelay = 160 } = {}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);
  const openTimer = useRef(null);
  const ref = useRef(null);

  const canHover = useCallback(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches,
    [],
  );

  const clearTimers = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (openTimer.current) clearTimeout(openTimer.current);
    closeTimer.current = null;
    openTimer.current = null;
  }, []);

  const scheduleOpen = useCallback(() => {
    if (!canHover()) return;
    clearTimers();
    openTimer.current = setTimeout(() => setOpen(true), openDelay);
  }, [canHover, clearTimers, openDelay]);

  const scheduleClose = useCallback(() => {
    if (!canHover()) return;
    clearTimers();
    closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
  }, [canHover, clearTimers, closeDelay]);

  const toggleClick = useCallback(() => {
    if (!canHover()) setOpen((v) => !v);
  }, [canHover]);

  const close = useCallback(() => {
    clearTimers();
    setOpen(false);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const containerProps = {
    ref,
    onMouseEnter: scheduleOpen,
    onMouseLeave: scheduleClose,
    onFocus: () => {
      if (!canHover()) return;
      clearTimers();
      setOpen(true);
    },
    onBlur: (e) => {
      if (!canHover()) return;
      if (ref.current?.contains(e.relatedTarget)) return;
      scheduleClose();
    },
  };

  return { open, setOpen, close, toggleClick, containerProps, canHover };
}
