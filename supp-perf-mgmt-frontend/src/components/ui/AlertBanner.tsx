'use client';

import { useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import type { KpiStatus } from '@/types';

import StatusChip from './StatusChip';

interface AlertBannerProps {
  status?: KpiStatus;
  message?: string;
  onSeeMore?: () => void;
}

export default function AlertBanner({
  status = 'YELLOW',
  message = 'KPI Alert',
  onSeeMore,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Box
      role="alert"
      display="flex"
      alignItems="center"
      gap={1.5}
      px={2}
      py={1.25}
      bgcolor="warning.light"
      color="warning.dark"
      borderRadius={1}
      border="1px solid var(--color-alert-border)"
    >
      <WarningAmberIcon sx={{ fontSize: 18, flexShrink: 0 }} />

      <Typography variant="body2" fontWeight={500} color="inherit">
        {message}
      </Typography>

      <StatusChip status={status} />

      {onSeeMore && (
        <Typography
          component="button"
          variant="body2"
          color="inherit"
          fontFamily="inherit"
          border="none"
          p={0}
          onClick={onSeeMore}
          sx={{
            textDecoration: 'underline',
            cursor: 'pointer',
            background: 'none',
          }}
        >
          See More
        </Typography>
      )}

      <Box flexGrow={1} />

      <IconButton
        size="small"
        aria-label="Dismiss alert"
        color="inherit"
        onClick={() => setDismissed(true)}
        sx={{ p: 0.5 }}
      >
        <CloseIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}
