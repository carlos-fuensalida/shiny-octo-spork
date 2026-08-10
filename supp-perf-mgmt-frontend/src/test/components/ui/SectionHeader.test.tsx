import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import SectionHeader from '@/components/ui/SectionHeader';

import { renderWithTheme } from '../../utils/renderWithTheme';

describe('SectionHeader', () => {
  it('renders the title', () => {
    renderWithTheme(<SectionHeader title="Incoming Material PPM" />);
    expect(screen.getByText('Incoming Material PPM')).toBeInTheDocument();
  });

  it('renders no button when no action is given', () => {
    renderWithTheme(<SectionHeader title="Incoming Material PPM" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the action button and fires its onClick', async () => {
    const onClick = vi.fn();
    renderWithTheme(
      <SectionHeader
        title="Incoming Material PPM"
        action={{ label: 'Deep Dive', onClick }}
      />,
    );

    const button = screen.getByRole('button', { name: /deep dive/i });
    expect(button).toBeInTheDocument();
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disables the action button when disabled is set', () => {
    renderWithTheme(
      <SectionHeader
        title="Incoming Material PPM"
        action={{ label: 'Deep Dive', disabled: true }}
      />,
    );
    expect(screen.getByRole('button', { name: /deep dive/i })).toBeDisabled();
  });

  it('renders the skeleton with the real title and an optional action placeholder', () => {
    const { container, rerender } = renderWithTheme(
      <SectionHeader.Skeleton title="Incoming Material PPM" />,
    );
    expect(screen.getByText('Incoming Material PPM')).toBeInTheDocument();
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(0);

    rerender(<SectionHeader.Skeleton title="Incoming Material PPM" action />);
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });
});
