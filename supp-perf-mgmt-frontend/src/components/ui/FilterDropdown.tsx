'use client';

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';

interface FilterDropdownProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  allLabel?: string;
}

export default function FilterDropdown({
  label,
  value,
  options,
  onChange,
  allLabel = 'All',
}: FilterDropdownProps) {
  const handleChange = (e: SelectChangeEvent) => onChange(e.target.value);

  return (
    <FormControl size="small" sx={{ minWidth: 110 }}>
      <InputLabel id={`filter-${label}-label`} sx={{ fontSize: 12 }}>
        {label}
      </InputLabel>
      <Select
        labelId={`filter-${label}-label`}
        id={`filter-${label}`}
        value={value}
        label={label}
        onChange={handleChange}
        sx={{ fontSize: 12 }}
      >
        <MenuItem value="" sx={{ fontSize: 12 }}>
          {allLabel}
        </MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 12 }}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
