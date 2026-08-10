import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SectionCard from '@/components/ui/SectionCard';

import { renderWithTheme } from '../../utils/renderWithTheme';

describe('SectionCard', () => {
  it('renders the title as a labelled section landmark', () => {
    renderWithTheme(
      <SectionCard title="Quality Performance">
        <SectionCard.Cell>tile</SectionCard.Cell>
      </SectionCard>,
    );

    expect(
      screen.getByRole('region', { name: 'Quality Performance' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Quality Performance')).toBeInTheDocument();
  });

  it('renders the footer when provided and omits it otherwise', () => {
    const { unmount } = renderWithTheme(
      <SectionCard title="Quality Performance" footer="As of January, 2026">
        <SectionCard.Cell>tile</SectionCard.Cell>
      </SectionCard>,
    );
    expect(screen.getByText('As of January, 2026')).toBeInTheDocument();
    unmount();

    renderWithTheme(
      <SectionCard title="Quality Performance">
        <SectionCard.Cell>tile</SectionCard.Cell>
      </SectionCard>,
    );
    expect(screen.queryByText(/As of/)).not.toBeInTheDocument();
  });

  it('renders all cells', () => {
    renderWithTheme(
      <SectionCard title="Quality Performance">
        <SectionCard.Cell>one</SectionCard.Cell>
        <SectionCard.Cell span={2}>two</SectionCard.Cell>
      </SectionCard>,
    );

    expect(screen.getByText('one')).toBeInTheDocument();
    expect(screen.getByText('two')).toBeInTheDocument();
  });
});

describe('SectionCard.Skeleton', () => {
  it('keeps the title so the layout does not shift', () => {
    renderWithTheme(
      <SectionCard.Skeleton title="Quality Performance" spans={[1, 1]} />,
    );

    expect(screen.getByText('Quality Performance')).toBeInTheDocument();
  });

  it('renders one placeholder cell per span', () => {
    const { container } = renderWithTheme(
      <SectionCard.Skeleton title="Quality Performance" spans={[1, 1, 2]} />,
    );

    // 3 cells × (1 title + 2 per metric column × 3 metrics) = 21
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(21);
  });
});
