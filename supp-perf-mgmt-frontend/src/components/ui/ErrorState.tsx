import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  minHeight?: string | number;
}

export default function ErrorState({
  title = 'Unable to load data',
  description = 'An error occurred while fetching data. Please try again.',
  onRetry,
  minHeight = 200,
}: ErrorStateProps) {
  return (
    <Box
      role="alert"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={1.5}
      textAlign="center"
      py={4}
      px={2}
      sx={{ minHeight }}
    >
      <ErrorOutlineIcon
        sx={{ fontSize: 48, color: 'error.main', opacity: 0.7 }}
      />
      <Typography variant="body1" fontWeight={500} color="error.main">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
        {description}
      </Typography>
      {onRetry && (
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
        >
          Retry
        </Button>
      )}
    </Box>
  );
}
