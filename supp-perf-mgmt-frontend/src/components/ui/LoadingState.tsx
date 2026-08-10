import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';

type Variant = 'card' | 'table' | 'page' | 'spinner';

interface LoadingStateProps {
  variant?: Variant;
  rows?: number;
}

export default function LoadingState({
  variant = 'card',
  rows = 3,
}: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={200}
        aria-busy="true"
        aria-label="Loading"
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (variant === 'table') {
    return (
      <Box aria-busy="true" aria-label="Loading table">
        <Skeleton height={40} sx={{ mb: 0.5 }} />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} height={32} sx={{ mb: 0.25 }} />
        ))}
      </Box>
    );
  }

  if (variant === 'page') {
    return (
      <Box
        display="grid"
        gridTemplateColumns="1fr 1fr"
        gap={2}
        aria-busy="true"
        aria-label="Loading page"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={120}
            sx={{ borderRadius: 1 }}
          />
        ))}
      </Box>
    );
  }

  // card
  return (
    <Box
      border="1px solid"
      borderColor="divider"
      borderRadius={1}
      p={2}
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton width="40%" height={20} sx={{ mb: 1.5 }} />
      <Skeleton width="70%" height={32} />
    </Box>
  );
}
