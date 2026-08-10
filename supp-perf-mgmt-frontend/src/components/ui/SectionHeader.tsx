import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import type { ViewHeaderAction } from './ViewHeader';

interface SectionHeaderProps {
  /** Section title, centered between the two dividers. */
  title: string;
  /** Right-aligned action button. Omit for no action. */
  action?: ViewHeaderAction;
}

/**
 * Shared section intro pattern used across the Quality page (and beyond):
 * divider — centered title — divider — optional right-aligned action button.
 * Not the same as `SectionCard`, which wraps a titled divider-grid of tiles.
 */
export default function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <Box display="flex" alignItems="center" gap={3} pt={2}>
      <Divider sx={{ flex: 1 }} />
      <Typography variant="h2" color="primary.main" noWrap>
        {title}
      </Typography>
      <Divider sx={{ flex: 1 }} />
      {action && (
        <Button
          variant="contained"
          color="primary"
          size="small"
          disabled={action.disabled}
          endIcon={action.icon ?? <ChevronRightIcon />}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

interface SectionHeaderSkeletonProps {
  /** Section titles are known up front (page structure, not fetched data), so
   * they render for real even in the loading state — only the action button
   * (whose presence may depend on data) needs a placeholder shape. */
  title: string;
  action?: boolean;
}

function SectionHeaderSkeleton({
  title,
  action = false,
}: SectionHeaderSkeletonProps) {
  return (
    <Box display="flex" alignItems="center" gap={3} pt={2}>
      <Divider sx={{ flex: 1 }} />
      <Typography variant="h2" color="primary.main" noWrap>
        {title}
      </Typography>
      <Divider sx={{ flex: 1 }} />
      {action && <Skeleton variant="rounded" width={111} height={32} />}
    </Box>
  );
}

SectionHeader.Skeleton = SectionHeaderSkeleton;

export type { SectionHeaderProps };
