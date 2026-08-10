'use client';

import { Fragment, useState } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import type { SxProps, Theme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string | number;
  /**
   * Per-row styling applied to the `<TableCell>` itself rather than to its
   * contents — use it for fills that must cover the whole cell (e.g. the
   * status-highlighted PPM/CAL variance cells, whose tint and 4px status rule
   * run the full row height). Styling the rendered content instead leaves an
   * inset block inside the cell's padding. Receives the row so the style can
   * depend on its data.
   */
  cellSx?: (row: T) => SxProps<Theme>;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  loading?: boolean;
  footer?: React.ReactNode;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  stickyHeader?: boolean;
  maxHeight?: string | number;
  groupBy?: (row: T) => string;
  /**
   * Row density. `'small'` (default) keeps the compact rows every existing
   * caller expects; `'medium'` gives MUI's standard ~56px rows, matching the
   * Figma KPI tables (PPM/CAL).
   */
  size?: 'small' | 'medium';
  /** Renders expanded content below a row. Presence of this prop is what
   * turns on the expand toggle column — omit it for a plain table. Expansion
   * state is uncontrolled (owned internally via each row's `getRowKey`). */
  renderExpanded?: (row: T) => React.ReactNode;
}

export default function DataTable<T>({
  columns,
  rows,
  getRowKey,
  loading = false,
  footer,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  stickyHeader = false,
  maxHeight,
  groupBy,
  size = 'small',
  renderExpanded,
}: DataTableProps<T>) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpanded = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const hasPagination =
    page !== undefined && pageSize !== undefined && totalItems !== undefined;
  const columnCount = columns.length + (renderExpanded ? 1 : 0);

  // Group rows when groupBy is provided
  const groupedRows = groupBy
    ? rows.reduce<Array<{ group: string; rows: T[] }>>((acc, row) => {
        const group = groupBy(row);
        const existing = acc.find((g) => g.group === group);
        if (existing) {
          existing.rows.push(row);
        } else {
          acc.push({ group, rows: [row] });
        }
        return acc;
      }, [])
    : null;

  const renderDataRow = (row: T) => {
    const key = getRowKey(row);
    const isExpanded = renderExpanded ? expandedKeys.has(key) : false;

    return (
      <Fragment key={key}>
        <TableRow
          hover
          onClick={renderExpanded ? () => toggleExpanded(key) : undefined}
          sx={renderExpanded ? { cursor: 'pointer' } : undefined}
        >
          {renderExpanded && (
            <TableCell padding="checkbox">
              <IconButton
                size="small"
                aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(key);
                }}
                sx={{
                  transform: isExpanded ? 'rotate(180deg)' : 'none',
                  transition: (theme) => theme.transitions.create('transform'),
                }}
              >
                <ExpandMoreIcon fontSize="small" />
              </IconButton>
            </TableCell>
          )}
          {columns.map((col) => (
            <TableCell
              key={col.key}
              align={col.align ?? 'left'}
              sx={col.cellSx?.(row)}
            >
              {col.render
                ? col.render(row)
                : String((row as Record<string, unknown>)[col.key] ?? '—')}
            </TableCell>
          ))}
        </TableRow>
        {renderExpanded && isExpanded && (
          <TableRow>
            <TableCell
              colSpan={columnCount}
              sx={{ bgcolor: 'background.default' }}
            >
              {renderExpanded(row)}
            </TableCell>
          </TableRow>
        )}
      </Fragment>
    );
  };

  return (
    <TableContainer
      sx={{
        maxHeight: maxHeight,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Table stickyHeader={stickyHeader} size={size}>
        <TableHead>
          <TableRow>
            {renderExpanded && <TableCell padding="checkbox" />}
            {columns.map((col) => (
              <TableCell
                key={col.key}
                align={col.align ?? 'left'}
                sx={{
                  width: col.width,
                  whiteSpace: 'nowrap',
                  bgcolor: 'var(--color-gray-lightest)',
                  borderBottomColor: 'var(--color-gray)',
                }}
              >
                {col.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {renderExpanded && (
                    <TableCell padding="checkbox">
                      <Skeleton variant="circular" width={24} height={24} />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : groupedRows
              ? groupedRows.map(({ group, rows: groupRows }) => (
                  <Fragment key={`group-${group}`}>
                    <TableRow>
                      <TableCell
                        colSpan={columnCount}
                        sx={{
                          bgcolor: 'background.default',
                          fontFamily: 'var(--font-open-sans)',
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: 'text.secondary',
                          py: 0.75,
                        }}
                      >
                        {group}
                      </TableCell>
                    </TableRow>
                    {groupRows.map(renderDataRow)}
                  </Fragment>
                ))
              : rows.map(renderDataRow)}
        </TableBody>

        {(footer || hasPagination) && (
          <TableFooter>
            {footer && (
              <TableRow>
                <TableCell colSpan={columnCount}>
                  <Box display="flex" alignItems="center">
                    <Typography variant="body2" fontWeight={500}>
                      {footer}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
            {hasPagination && (
              <TableRow>
                <TablePagination
                  count={totalItems!}
                  page={page!}
                  rowsPerPage={pageSize!}
                  onPageChange={(_, p) => onPageChange?.(p)}
                  onRowsPerPageChange={(e) =>
                    onPageSizeChange?.(Number(e.target.value))
                  }
                  rowsPerPageOptions={[10, 25, 50]}
                />
              </TableRow>
            )}
          </TableFooter>
        )}
      </Table>
    </TableContainer>
  );
}
