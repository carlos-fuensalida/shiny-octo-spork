import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import CardSurface from './CardSurface';

interface ContentCardProps {
  /** Card title, shown above the header divider. */
  title: string;
  /** Footer line below the closing divider, e.g. "As of January, 2026". */
  footer?: string;
  children: React.ReactNode;
}

/**
 * The design system's "Card Template" (Figma `804:26162` / `804:26161`):
 * a white 12px-radius panel — title, divider, content, divider, footer —
 * wrapping one piece of section content. Every Quality section card uses it,
 * so the chrome lives here rather than being redrawn per card.
 *
 * Not `SectionCard`, which is the Summary view's 6-column divider *grid*;
 * `ContentCard` holds a single free-form child (a table, a list, a chart).
 *
 * The panel itself comes from `CardSurface`, shared with the Products on Hold
 * and Exhibits cards; this component owns only the title/divider/footer chrome
 * layered on top.
 */
export default function ContentCard({
  title,
  footer,
  children,
}: ContentCardProps) {
  return (
    <CardSurface
      p={3}
      display="flex"
      flexDirection="column"
      gap={2}
      height="100%"
    >
      <Box px={3} pt={3}>
        <Typography variant="h2" color="primary.main" mb={2}>
          {title}
        </Typography>
        <Divider />
      </Box>

      <Box px={3} flex={1}>
        {children}
      </Box>

      {footer && (
        <Box px={3}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            {footer}
          </Typography>
        </Box>
      )}
    </CardSurface>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

interface ContentCardSkeletonProps {
  /** Titles are page structure, known up front, so they render for real —
   * only the async content and footer get placeholder shapes (matching
   * `SectionHeader.Skeleton`'s approach). */
  title: string;
  footer?: boolean;
  children: React.ReactNode;
}

function ContentCardSkeleton({
  title,
  footer = true,
  children,
}: ContentCardSkeletonProps) {
  return (
    <CardSurface
      p={3}
      display="flex"
      flexDirection="column"
      gap={2}
      height="100%"
    >
      <Box px={3} pt={3}>
        <Typography variant="h2" color="primary.main" mb={2}>
          {title}
        </Typography>
        <Divider />
      </Box>

      <Box px={3} flex={1}>
        {children}
      </Box>

      {footer && (
        <Box px={3}>
          <Divider sx={{ mb: 2 }} />
          <Skeleton variant="text" width={140} />
        </Box>
      )}
    </CardSurface>
  );
}

ContentCard.Skeleton = ContentCardSkeleton;

export type { ContentCardProps };
