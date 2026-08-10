import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import DataTable, { type Column } from '@/components/ui/DataTable';

import { renderWithTheme } from '../../utils/renderWithTheme';

interface Row {
  id: string;
  region: string;
  value: string;
}

const rows: Row[] = [
  { id: 'global', region: 'Global', value: '90%' },
  { id: 'nar', region: 'NAR', value: '89%' },
];

const columns: Column<Row>[] = [
  { key: 'region', header: 'Region' },
  { key: 'value', header: 'Value' },
];

describe('DataTable', () => {
  it('renders rows and columns without renderExpanded (existing usage unaffected)', () => {
    renderWithTheme(
      <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} />,
    );

    expect(screen.getByText('Region')).toBeInTheDocument();
    expect(screen.getByText('Global')).toBeInTheDocument();
    expect(screen.getByText('NAR')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('preserves the header and 5 skeleton rows while loading', () => {
    const { container } = renderWithTheme(
      <DataTable columns={columns} rows={[]} getRowKey={(r) => r.id} loading />,
    );

    expect(screen.getByText('Region')).toBeInTheDocument();
    expect(container.querySelectorAll('tbody tr')).toHaveLength(5);
  });

  it('applies cellSx to the cell element itself, per row', () => {
    const withCellSx: Column<Row>[] = [
      { key: 'region', header: 'Region' },
      {
        key: 'value',
        header: 'Value',
        cellSx: (row) =>
          row.id === 'global' ? { backgroundColor: 'rgb(1, 2, 3)' } : {},
      },
    ];

    renderWithTheme(
      <DataTable columns={withCellSx} rows={rows} getRowKey={(r) => r.id} />,
    );

    // The style lands on the <td>, not on an inner wrapper — that's what lets
    // a status tint cover the full cell rather than sitting inset within it.
    const highlighted = screen.getByText('90%');
    expect(highlighted.tagName).toBe('TD');
    expect(highlighted).toHaveStyle({ backgroundColor: 'rgb(1, 2, 3)' });
    expect(screen.getByText('89%')).not.toHaveStyle({
      backgroundColor: 'rgb(1, 2, 3)',
    });
  });

  it('renders an expand toggle per row and shows/hides renderExpanded content on click', async () => {
    renderWithTheme(
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        renderExpanded={(row) => <div>Details for {row.region}</div>}
      />,
    );

    expect(screen.queryByText('Details for Global')).not.toBeInTheDocument();

    const toggles = screen.getAllByRole('button', { name: /expand row/i });
    expect(toggles).toHaveLength(2);

    await userEvent.click(toggles[0]);
    expect(screen.getByText('Details for Global')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /collapse row/i }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /collapse row/i }),
    );
    expect(screen.queryByText('Details for Global')).not.toBeInTheDocument();
  });

  it('toggles expansion when the row itself is clicked', async () => {
    renderWithTheme(
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        renderExpanded={(row) => <div>Details for {row.region}</div>}
      />,
    );

    await userEvent.click(screen.getByText('Global'));
    expect(screen.getByText('Details for Global')).toBeInTheDocument();
  });

  it('adds a leading skeleton toggle column while loading when renderExpanded is set', () => {
    const { container } = renderWithTheme(
      <DataTable
        columns={columns}
        rows={[]}
        getRowKey={(r) => r.id}
        loading
        renderExpanded={(row) => <div>{row.region}</div>}
      />,
    );

    const firstRow = container.querySelector('tbody tr');
    expect(
      firstRow?.querySelector('.MuiSkeleton-circular'),
    ).toBeInTheDocument();
  });
});
