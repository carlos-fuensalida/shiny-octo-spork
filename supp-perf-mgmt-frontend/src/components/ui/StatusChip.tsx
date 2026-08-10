import Chip from '@mui/material/Chip';

import type { KpiStatus } from '@/types';

// bg / color / dotColor values: palette paths or CSS vars (no hex literals)
const CONFIG: Record<
  NonNullable<KpiStatus>,
  { label: string; bg: string; color: string; dotColor: string }
> = {
  GREEN: {
    label: 'On Track',
    bg: 'var(--color-green-light)',
    color: 'success.main',
    dotColor: 'var(--color-green)',
  },
  YELLOW: {
    label: 'Watch',
    bg: 'var(--color-amber-light)',
    color: 'var(--color-amber-dark)',
    dotColor: 'var(--color-amber)',
  },
  RED: {
    label: 'At Risk',
    bg: 'var(--color-red-light)',
    color: 'var(--color-red-dark)',
    dotColor: 'var(--color-orange)',
  },
  NEUTRAL: {
    label: 'Neutral',
    bg: 'var(--color-gray-light)',
    color: 'text.primary',
    dotColor: 'text.secondary',
  },
};

interface StatusChipProps {
  status: KpiStatus;
  size?: 'small' | 'medium';
}

export default function StatusChip({
  status,
  size = 'small',
}: StatusChipProps) {
  const cfg = CONFIG[status];
  return (
    <Chip
      size={size}
      label={cfg.label}
      sx={{
        bgcolor: cfg.bg,
        color: cfg.color,
        fontWeight: 500,
        fontSize: 11,
        height: size === 'small' ? 20 : 24,
        borderRadius: 1,
        '& .MuiChip-label': { px: 1 },
        '&::before': {
          content: '""',
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          bgcolor: cfg.dotColor,
          ml: 0.75,
          flexShrink: 0,
        },
      }}
    />
  );
}
