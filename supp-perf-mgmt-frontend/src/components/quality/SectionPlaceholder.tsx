import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

interface SectionPlaceholderProps {
  /** Section heading, e.g. "Incoming Material PPM". */
  title: string;
}

/**
 * Scaffold stand-in for a Quality page section. Establishes the vertical order
 * and spacing of the section stack; the real content (charts, tables, stat
 * cards) and the shared SectionHeader arrive in tickets T2–T8.
 * See specs/features/SPM-128-quality-page/README.md.
 */
export default function SectionPlaceholder({ title }: SectionPlaceholderProps) {
  return (
    <Box
      component="section"
      aria-label={title}
      border={1}
      borderColor="divider"
      borderRadius={2}
      bgcolor="background.paper"
      px={6}
      py={6}
    >
      <Typography variant="h2" color="primary.main">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={1}>
        Section coming soon
      </Typography>
    </Box>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

/**
 * Loading state. Preserves the placeholder's box and title line so the layout
 * does not shift when data arrives (UI_REQUIREMENTS_SPEC §14).
 */
function SectionPlaceholderSkeleton() {
  return (
    <Box
      border={1}
      borderColor="divider"
      borderRadius={2}
      bgcolor="background.paper"
      px={6}
      py={6}
    >
      <Skeleton variant="text" width={220} height={32} />
      <Skeleton variant="text" width={140} />
    </Box>
  );
}

SectionPlaceholder.Skeleton = SectionPlaceholderSkeleton;

export type { SectionPlaceholderProps };
