import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ContentCard from '@/components/ui/ContentCard';

import { renderWithTheme } from '../../utils/renderWithTheme';

describe('ContentCard', () => {
  it('renders the title and its content', () => {
    renderWithTheme(
      <ContentCard title="Incoming Material PPM">
        <div>card body</div>
      </ContentCard>,
    );

    expect(screen.getByText('Incoming Material PPM')).toBeInTheDocument();
    expect(screen.getByText('card body')).toBeInTheDocument();
  });

  it('renders the footer when provided', () => {
    renderWithTheme(
      <ContentCard title="Top Offenders" footer="As of January, 2026">
        <div>card body</div>
      </ContentCard>,
    );

    expect(screen.getByText('As of January, 2026')).toBeInTheDocument();
  });

  it('omits the footer when not provided', () => {
    renderWithTheme(
      <ContentCard title="Top Offenders">
        <div>card body</div>
      </ContentCard>,
    );

    expect(screen.queryByText(/^As of/)).not.toBeInTheDocument();
  });

  // Regression guard for SPM-132: the panel styling moved out into
  // `CardSurface`, which must not change what `ContentCard` renders. The
  // shipped PPM/CAL section depends on exactly this structure.
  it('still draws the card panel on its outermost element', () => {
    const { container } = renderWithTheme(
      <ContentCard title="Incoming Material PPM">
        <div>card body</div>
      </ContentCard>,
    );

    const styles = getComputedStyle(container.firstElementChild as HTMLElement);

    expect(styles.borderRadius).toBe('12px');
    expect(styles.borderWidth).toBe('1px');
    expect(styles.display).toBe('flex');
  });

  it('still renders one divider without a footer', () => {
    const { container } = renderWithTheme(
      <ContentCard title="Top Offenders">
        <div>card body</div>
      </ContentCard>,
    );
    expect(container.querySelectorAll('hr.MuiDivider-root')).toHaveLength(1);
  });

  it('still renders two dividers with a footer', () => {
    const { container } = renderWithTheme(
      <ContentCard title="Top Offenders" footer="As of January, 2026">
        <div>card body</div>
      </ContentCard>,
    );
    expect(container.querySelectorAll('hr.MuiDivider-root')).toHaveLength(2);
  });

  it('keeps the real title in the skeleton and shapes the footer', () => {
    const { container } = renderWithTheme(
      <ContentCard.Skeleton title="Incoming Material PPM">
        <div>placeholder</div>
      </ContentCard.Skeleton>,
    );

    expect(screen.getByText('Incoming Material PPM')).toBeInTheDocument();
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });
});
