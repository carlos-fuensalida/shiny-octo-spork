import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HighlightCard } from '@/components/ui';

import { renderWithTheme } from '../../utils/renderWithTheme';

describe('HighlightCard', () => {
  it('renders the label and the value', () => {
    renderWithTheme(<HighlightCard label="Total Recovered" value="US$15K" />);

    expect(screen.getByText('Total Recovered')).toBeInTheDocument();
    expect(screen.getByText('US$15K')).toBeInTheDocument();
  });

  it('renders the value as a paragraph, not a heading', () => {
    // The 24px step is this theme's `h1`; a bare figure must not land in the
    // document outline alongside the section titles.
    renderWithTheme(<HighlightCard label="Global" value="24" />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('24').tagName).toBe('P');
  });

  it('separates label from value with a divider', () => {
    const { container } = renderWithTheme(
      <HighlightCard label="On going" value="US$24M" />,
    );

    expect(container.querySelector('.MuiDivider-root')).toBeInTheDocument();
  });

  // Figma draws two layouts for this card: horizontal at 221.5px with the
  // chatbot closed (`1365:14446`), stacked at 151.5px with it open
  // (`1423:14651`). jsdom doesn't evaluate container queries, so these assert
  // the mechanism is wired rather than the resulting pixels.
  describe('orientation', () => {
    it('makes the card its own query container', () => {
      const { container } = renderWithTheme(
        <HighlightCard label="Global" value="24" />,
      );

      // Three levels below the viewport (page column → section → three cards),
      // so the card's own width is the only reliable signal.
      const panel = container.firstElementChild as HTMLElement;
      expect(getComputedStyle(panel).containerType).toBe('inline-size');
    });

    it('stacks by default and turns horizontal above the card threshold', () => {
      renderWithTheme(<HighlightCard label="Global" value="24" />);

      const css = Array.from(document.querySelectorAll('style'))
        .map((tag) => tag.textContent ?? '')
        .join('');

      // Default (narrow / chat open): column with a horizontal rule.
      expect(css).toContain('flex-direction:column');
      // Above the threshold (chat closed): row with a vertical rule.
      expect(css).toMatch(/@container \(min-width:\s*200px\)/);
      expect(css).toContain('border-right-width:thin');
    });
  });

  it('passes the value through verbatim — formatting is the caller’s', () => {
    // The three Cost Recovery cards mix a count with two currency figures, so
    // the card must not impose a format of its own.
    renderWithTheme(<HighlightCard label="Global Conversion" value="24" />);

    expect(screen.getByText('24')).toBeInTheDocument();
  });

  describe('Skeleton', () => {
    it('renders placeholders on the same panel, with no text', () => {
      const { container } = renderWithTheme(<HighlightCard.Skeleton />);

      expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(2);
      expect(
        container.querySelector('.MuiDivider-vertical'),
      ).toBeInTheDocument();
    });
  });
});
