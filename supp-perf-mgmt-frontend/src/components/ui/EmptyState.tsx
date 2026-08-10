import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  minHeight?: string | number;
}

export default function EmptyState({
  title = 'No data available',
  description,
  action,
  icon,
  minHeight = 200,
}: EmptyStateProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={1.5}
      textAlign="center"
      py={4}
      px={2}
      aria-label="No data"
      sx={{ minHeight }}
    >
      {icon ?? (
        <InboxOutlinedIcon
          sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }}
        />
      )}
      <Typography variant="body1" fontWeight={500} color="text.secondary">
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 320 }}
        >
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
