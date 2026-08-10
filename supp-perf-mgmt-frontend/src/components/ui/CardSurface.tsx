import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';

type CardSurfaceProps = BoxProps;

/**
 * The bare panel every Quality page card sits on: `background.paper`, a 1px
 * `divider` border, and a 12px radius (Figma's card corner across
 * `804:26162`, `804:26188`, `804:26272`).
 *
 * Deliberately opinion-free beyond those three properties — it owns no title,
 * padding, or layout, because the cards that use it diverge completely above
 * that line: `ContentCard` puts an `h2` over a divider, `ProductsOnHoldCard` a
 * plain 14px label, `ExhibitsCard` a full-bleed colour band. Folding those into
 * one component's props would be a variant matrix over three layouts that share
 * no internals; this extracts the one thing they genuinely do share.
 *
 * Any `Box` prop passes through, so callers add their own padding and layout.
 */
export default function CardSurface({
  children,
  ...boxProps
}: CardSurfaceProps) {
  return (
    <Box
      border={1}
      borderColor="divider"
      borderRadius={3}
      bgcolor="background.paper"
      {...boxProps}
    >
      {children}
    </Box>
  );
}

export type { CardSurfaceProps };
