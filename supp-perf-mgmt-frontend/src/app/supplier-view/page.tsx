import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Supplier Performance Report',
};

// token is provided as a query param by the signed URL
// e.g. /supplier-view?token=abc123
interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function SupplierViewPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Box maxWidth={480} mx="auto" mt={8} textAlign="center">
        <Alert severity="error" sx={{ mb: 2 }}>
          This link is invalid. No access token was provided.
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Please contact your Whirlpool representative if you believe this is an
          error.
        </Typography>
      </Box>
    );
  }

  // Token validation and data fetch will be wired to getSupplierLinkData(token)
  // once Backend A is available. Placeholder shown until then.
  return (
    <Box maxWidth={960} mx="auto">
      <Typography variant="h1" gutterBottom>
        Supplier Performance Report
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Supplier limited view — implementation pending
      </Typography>
    </Box>
  );
}
