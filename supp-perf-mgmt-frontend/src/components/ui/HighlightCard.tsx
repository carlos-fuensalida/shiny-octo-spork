import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import CardSurface from './CardSurface';

interface HighlightCardProps {
  /** Left (or top) cell — what the figure measures. */
  label: string;
  /**
   * Right (or bottom) cell. A pre-formatted string, not a number: the Cost
   * Recovery cards mix a plain count with two currency figures, so formatting
   * belongs to the caller and this stays a pure layout.
   */
  value: string;
}

/**
 * Above this card width the label and value sit side by side; below it they
 * stack. Both layouts are drawn in Figma — 221.5px wide and horizontal with the
 * chatbot closed (`1365:14446`), 151.5px and vertical with it open
 * (`1423:14651`) — so this is a design state, not a fallback. 200px sits
 * between the two and is measured against the card's own box, which is what
 * actually determines whether "Total Recovered │ US$15K" fits on one line.
 */
const HORIZONTAL_MIN = 200;

/**
 * A single labelled figure on the shared bordered panel (Figma "Highlight
 * Card"). Used by the Quality page's Cost Recovery and Focus Supplier sections.
 *
 * Rewritten by SPM-135. It previously rendered a title plus a status `Chip`
 * (SPM-91) for Summary highlight cards that were never built and are recorded
 * as dropped in `UI_REQUIREMENTS_SPEC.md` §4.1 — it had no callers, so the name
 * was reclaimed for the card the design system actually draws under it rather
 * than adding a near-identical second component.
 *
 * The panel is `CardSurface` at an 8px radius: the frame's corner is 8px where
 * every other Quality card is 12px, and `CardSurface` takes `Box` props, so the
 * override costs one prop instead of a redrawn border.
 */
export default function HighlightCard({ label, value }: HighlightCardProps) {
  return (
    <Panel>
      <Typography
        variant="body1"
        fontWeight={500}
        color="primary.main"
        textAlign="center"
      >
        {label}
      </Typography>
      <Rule />
      {/* `h1` is this theme's 24px/400 step (Figma `typography/h5`), rendered as
          a `<p>` — a bare figure isn't a document heading. */}
      <Typography variant="h1" component="p" color="text.primary" noWrap>
        {value}
      </Typography>
    </Panel>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function HighlightCardSkeleton() {
  return (
    <Panel>
      <Skeleton variant="text" width={96} />
      <Rule />
      <Skeleton variant="text" width={56} />
    </Panel>
  );
}

HighlightCard.Skeleton = HighlightCardSkeleton;

/**
 * Shared chrome so the skeleton can't drift from the real card: 8px radius,
 * 16px padding, contents centred with an 8px gap, and the row/column flip.
 *
 * The card is its own query container, so the orientation follows the width it
 * actually gets rather than the page's — three cards inside a half-width
 * section is two levels of division away from the viewport, and the chatbot
 * panel moves both. Height is never fixed (64px horizontal / 103px vertical in
 * the frames) so a label that wraps can't clip.
 */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <CardSurface
      borderRadius={2}
      p={4}
      overflow="hidden"
      sx={{ containerType: 'inline-size' }}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
        height="100%"
        sx={{
          [`@container (min-width: ${HORIZONTAL_MIN}px)`]: {
            flexDirection: 'row',
          },
        }}
      >
        {children}
      </Box>
    </CardSurface>
  );
}

/**
 * The divider between label and value, which turns with the card: a horizontal
 * rule across the content box when stacked, a vertical one between the two
 * cells when side by side. One element rather than two swapped by a query, so
 * there's no state in which both or neither is rendered.
 */
function Rule() {
  return (
    <Divider
      orientation="vertical"
      flexItem
      sx={{
        alignSelf: 'stretch',
        borderRightWidth: 0,
        borderBottomWidth: 'thin',
        [`@container (min-width: ${HORIZONTAL_MIN}px)`]: {
          borderRightWidth: 'thin',
          borderBottomWidth: 0,
        },
      }}
    />
  );
}

export type { HighlightCardProps };
