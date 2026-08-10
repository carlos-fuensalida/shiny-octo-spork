import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ViewHeader from '@/components/ui/ViewHeader';

import { renderWithTheme } from '../../utils/renderWithTheme';

describe('ViewHeader', () => {
  it('renders the title and subtitle', () => {
    renderWithTheme(
      <ViewHeader title="Quality" subtitle="Steel Forgings · All regions" />,
    );

    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(
      screen.getByText('Steel Forgings · All regions'),
    ).toBeInTheDocument();
  });

  it('renders no buttons when no actions are given', () => {
    renderWithTheme(<ViewHeader title="Quality" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders one button per action, honouring the disabled flag', () => {
    renderWithTheme(
      <ViewHeader
        title="Quality"
        actions={[
          { label: 'Filters', disabled: true },
          { label: 'Export', disabled: true },
        ]}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(screen.getByRole('button', { name: /filters/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /export/i })).toBeDisabled();
  });

  it('fires an enabled action’s onClick', async () => {
    const onClick = vi.fn();
    renderWithTheme(
      <ViewHeader title="Quality" actions={[{ label: 'Refresh', onClick }]} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
