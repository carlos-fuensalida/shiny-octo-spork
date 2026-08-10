'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(val, max));
}

interface UsePanelResizeOptions {
  minWidthSm: number;
  minWidthXl: number;
  xlBreakpoint?: number;
}

interface UsePanelResizeReturn {
  width: number;
  isResizing: boolean;
  handleDragStart: (e: React.MouseEvent) => void;
  panelRef: React.RefObject<HTMLElement | null>;
}

export function usePanelResize({
  minWidthSm,
  minWidthXl,
  xlBreakpoint = 1536,
}: UsePanelResizeOptions): UsePanelResizeReturn {
  const resolveMin = (windowWidth: number) =>
    windowWidth >= xlBreakpoint ? minWidthXl : minWidthSm;

  // JS state is only used after the user drags. Before any drag, ChatbotPanel
  // uses var(--chatpanel-default-width) from CSS which resolves correctly per
  // viewport via a media query — no JS correction needed, no SSR flash.
  const [width, setWidth] = useState<number>(minWidthXl);
  const [isResizing, setIsResizing] = useState(false);

  // Ref to the panel DOM element so handleDragStart can read the actual rendered
  // width (which may come from the CSS variable, not from JS state).
  const panelRef = useRef<HTMLElement | null>(null);

  // Track the current minimum for drag clamping.
  const minWidthRef = useRef(minWidthXl);
  useEffect(() => {
    minWidthRef.current = resolveMin(window.innerWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minWidthSm, minWidthXl, xlBreakpoint]);

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      // Read the actual rendered width from the DOM so drag starts from the
      // correct position even when the CSS variable (not JS state) is driving width.
      const actualWidth = panelRef.current?.offsetWidth ?? width;
      isDragging.current = true;
      setIsResizing(true);
      setWidth(actualWidth);
      dragStartX.current = e.clientX;
      dragStartWidth.current = actualWidth;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    },
    [width],
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = dragStartX.current - e.clientX;
      const max = Math.floor(window.innerWidth / 2);
      setWidth(clamp(dragStartWidth.current + delta, minWidthRef.current, max));
    };
    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      setIsResizing(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return { width, isResizing, handleDragStart, panelRef };
}
