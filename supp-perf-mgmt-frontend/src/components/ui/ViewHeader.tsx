import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

/** A single action button in a view header. */
interface ViewHeaderAction {
  label: string;
  /** Trailing icon, e.g. `<FilterListIcon />`. */
  icon?: React.ReactNode;
  onClick?: () => void;
  /** Disabled stub — behaviour not yet defined. */
  disabled?: boolean;
}

interface ViewHeaderProps {
  /** Page title — `h1`, `primary.main`. */
  title: string;
  /** Subtitle line, e.g. "Steel Forgings · All regions" — `secondary.main`. */
  subtitle?: string;
  /** Right-aligned action buttons. Omit or pass `[]` for a title-only header. */
  actions?: ViewHeaderAction[];
}

/**
 * Shared view page header: a title + optional subtitle on the left, and a row
 * of text action buttons on the right. Used by every top-level view (Summary,
 * Quality, Delivery, …) so the header pattern lives in one place rather than
 * being copied per view.
 */
export default function ViewHeader({
  title,
  subtitle,
  actions = [],
}: ViewHeaderProps) {
  return (
    <Box
      display="flex"
      alignItems="flex-start"
      justifyContent="space-between"
      flexWrap="wrap"
      gap={4}
    >
      <Box>
        <Typography variant="h1" color="primary.main">
          {title}
        </Typography>
        {subtitle && (
          <Typography fontSize={16} color="secondary.main">
            {subtitle}
          </Typography>
        )}
      </Box>

      {actions.length > 0 && (
        <Box display="flex" alignItems="center" gap={2}>
          {actions.map((action) => (
            <Button
              key={action.label}
              size="small"
              variant="text"
              disabled={action.disabled}
              endIcon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );
}

export type { ViewHeaderAction, ViewHeaderProps };
