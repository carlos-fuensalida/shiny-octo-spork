import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CardSurface from '@/components/ui/CardSurface';

import { renderWithTheme } from '../../utils/renderWithTheme';

describe('CardSurface', () => {
  it('renders its children', () => {
    renderWithTheme(
      <CardSurface>
        <div>panel body</div>
      </CardSurface>,
    );

    expect(screen.getByText('panel body')).toBeInTheDocument();
  });

  it('applies the shared panel styling', () => {
    const { container } = renderWithTheme(
      <CardSurface>
        <div>panel body</div>
      </CardSurface>,
    );

    const surface = container.firstElementChild as HTMLElement;
    const styles = getComputedStyle(surface);

    expect(styles.borderRadius).toBe('12px');
    expect(styles.borderWidth).toBe('1px');
  });

  it('passes Box props through so callers own padding and layout', () => {
    const { container } = renderWithTheme(
      <CardSurface p={4} display="flex" data-testid="surface">
        <div>panel body</div>
      </CardSurface>,
    );

    const surface = container.firstElementChild as HTMLElement;

    expect(surface).toHaveAttribute('data-testid', 'surface');
    expect(getComputedStyle(surface).display).toBe('flex');
  });
});
