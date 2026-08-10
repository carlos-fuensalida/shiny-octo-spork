'use client';

import FilterListIcon from '@mui/icons-material/FilterList';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import type { FilterMetadata, FilterParams } from '@/types';

import FilterDropdown from './FilterDropdown';

const REGION_OPTIONS = [
  { value: 'GLOBAL', label: 'Global' },
  { value: 'NAR', label: 'NAR' },
  { value: 'LAR', label: 'LAR' },
];

const MONTH_OPTIONS = [
  { value: '1', label: 'Jan' },
  { value: '2', label: 'Feb' },
  { value: '3', label: 'Mar' },
  { value: '4', label: 'Apr' },
  { value: '5', label: 'May' },
  { value: '6', label: 'Jun' },
  { value: '7', label: 'Jul' },
  { value: '8', label: 'Aug' },
  { value: '9', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
];

interface FilterBarProps {
  filters: FilterParams;
  metadata?: FilterMetadata | null;
  onChange: (updated: Partial<FilterParams>) => void;
  onOpenDrawer?: () => void;
  onExport?: () => void;
  showExport?: boolean;
}

export default function FilterBar({
  filters,
  metadata,
  onChange,
  onOpenDrawer,
  onExport,
  showExport = true,
}: FilterBarProps) {
  const currentYear = new Date().getFullYear();
  const yearOptions = metadata?.years.map((y) => ({
    value: String(y),
    label: String(y),
  })) ?? [{ value: String(currentYear), label: String(currentYear) }];

  const plantOptions =
    metadata?.plants.map((p) => ({ value: p.plantId, label: p.plantName })) ??
    [];

  const commodityOptions =
    metadata?.commodities.map((c) => ({ value: c, label: c })) ?? [];

  const subcommodityOptions =
    metadata?.subcommodities.map((s) => ({ value: s, label: s })) ?? [];

  const locationOptions =
    metadata?.supplierLocations.map((l) => ({ value: l, label: l })) ?? [];

  const categoryOptions =
    metadata?.categories.map((c) => ({ value: c, label: c })) ?? [];

  return (
    <Box
      component="section"
      aria-label="Filters"
      display="flex"
      flexWrap="wrap"
      alignItems="center"
      gap={1}
    >
      <FilterDropdown
        label="Region"
        value={filters.region ?? ''}
        options={REGION_OPTIONS}
        onChange={(v) =>
          onChange({ region: (v as FilterParams['region']) || undefined })
        }
      />

      <FilterDropdown
        label="Plant"
        value={filters.plantIds?.[0] ?? ''}
        options={plantOptions}
        onChange={(v) => onChange({ plantIds: v ? [v] : undefined })}
      />

      <FilterDropdown
        label="Commodity"
        value={filters.commodity ?? ''}
        options={commodityOptions}
        onChange={(v) => onChange({ commodity: v || undefined })}
      />

      <FilterDropdown
        label="Subcommodity"
        value={filters.subcommodity ?? ''}
        options={subcommodityOptions}
        onChange={(v) => onChange({ subcommodity: v || undefined })}
      />

      <FilterDropdown
        label="Supplier Loc."
        value={filters.supplierLocation ?? ''}
        options={locationOptions}
        onChange={(v) => onChange({ supplierLocation: v || undefined })}
      />

      <FilterDropdown
        label="Month"
        value={filters.month !== undefined ? String(filters.month) : ''}
        options={MONTH_OPTIONS}
        allLabel="All months"
        onChange={(v) => onChange({ month: v ? Number(v) : undefined })}
      />

      <FilterDropdown
        label="Year"
        value={filters.year !== undefined ? String(filters.year) : ''}
        options={yearOptions}
        allLabel="All years"
        onChange={(v) => onChange({ year: v ? Number(v) : undefined })}
      />

      <FilterDropdown
        label="Category"
        value={filters.category ?? ''}
        options={categoryOptions}
        onChange={(v) => onChange({ category: v || undefined })}
      />

      <FilterDropdown
        label="Focus Supplier"
        value={
          filters.isFocusSupplier !== undefined
            ? String(filters.isFocusSupplier)
            : ''
        }
        options={[
          { value: 'true', label: 'Focus only' },
          { value: 'false', label: 'Non-focus' },
        ]}
        onChange={(v) =>
          onChange({ isFocusSupplier: v === '' ? undefined : v === 'true' })
        }
      />

      <Box flexGrow={1} />

      <Button
        size="small"
        variant="text"
        startIcon={<FilterListIcon />}
        onClick={onOpenDrawer}
        sx={{ textTransform: 'uppercase', fontSize: 13 }}
      >
        Filters
      </Button>

      {showExport && (
        <Button
          size="small"
          variant="text"
          startIcon={<SaveAltIcon />}
          onClick={onExport}
          sx={{ textTransform: 'uppercase', fontSize: 13 }}
        >
          Export
        </Button>
      )}
    </Box>
  );
}
