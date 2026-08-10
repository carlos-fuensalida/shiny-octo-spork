'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

const NAV_TABS = [
  { label: 'Summary', href: '/' },
  { label: 'Quality', href: '/quality' },
  { label: 'Delivery', href: '/delivery' },
  { label: 'Active Suppliers', href: '/suppliers' },
] as const;

function hrefToTabIndex(pathname: string): number {
  const idx = NAV_TABS.findIndex((t) =>
    t.href === '/' ? pathname === '/' : pathname.startsWith(t.href),
  );
  return idx >= 0 ? idx : 0;
}

export default function AppNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const value = hrefToTabIndex(pathname);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const tabRefs = useRef<(HTMLDivElement | null)[]>(
    Array(NAV_TABS.length).fill(null),
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  } | null>(null);

  // Recompute indicator position whenever the active tab changes.
  // useLayoutEffect fires synchronously before paint so the indicator
  // is in the right place on the very first render.
  const activeIndex = hoveredIndex ?? value;
  useLayoutEffect(() => {
    const tab = tabRefs.current[activeIndex];
    const wrapper = wrapperRef.current;
    if (!tab || !wrapper) return;
    const tabRect = tab.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    setIndicatorStyle({
      left: tabRect.left - wrapperRect.left,
      width: tabRect.width,
    });
  }, [activeIndex]);

  return (
    <Box
      component="nav"
      aria-label="Main navigation"
      position="fixed"
      top="var(--header-height)"
      left={0}
      right={0}
      height="var(--nav-height)"
      bgcolor="background.paper"
      borderBottom="1px solid"
      borderColor="divider"
      display="flex"
      alignItems="flex-end"
      px="var(--content-padding)"
      py={2}
      sx={{ zIndex: (t) => t.zIndex.appBar }}
    >
      <Box ref={wrapperRef} position="relative">
        <Tabs
          value={value}
          onChange={(_, idx: number) => router.push(NAV_TABS[idx].href)}
          aria-label="Dashboard views"
          sx={{ minHeight: 42 }}
          TabIndicatorProps={{ sx: { display: 'none' } }}
        >
          {NAV_TABS.map((tab, i) => (
            <Tab
              key={tab.href}
              label={tab.label}
              ref={(el: HTMLDivElement | null) => {
                tabRefs.current[i] = el;
              }}
              id={`nav-tab-${tab.label.toLowerCase().replace(/\s+/g, '-')}`}
              aria-controls={`nav-panel-${tab.label.toLowerCase().replace(/\s+/g, '-')}`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              sx={{
                color: 'text.secondary',
                lineHeight: '24px',
                minHeight: 42,
                py: '9px',
                '&.Mui-selected': { color: 'secondary.main' },
              }}
            />
          ))}
        </Tabs>

        {/* Sliding indicator — moves to the hovered tab, returns to selected on mouse leave */}
        {indicatorStyle && (
          <Box
            aria-hidden="true"
            position="absolute"
            bottom={0}
            height={2}
            sx={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              bgcolor:
                hoveredIndex !== null && hoveredIndex !== value
                  ? 'divider'
                  : 'secondary.main',
              transition:
                'left 200ms ease-in-out, width 200ms ease-in-out, background-color 150ms ease-in-out',
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>
    </Box>
  );
}
