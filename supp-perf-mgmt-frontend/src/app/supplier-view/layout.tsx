import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';

// Supplier limited view: no header, no navigation, no chatbot panel.
// Accessed via signed URL (/supplier-view?token=...).
export default function SupplierViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CssBaseline />
      <Box
        component="main"
        minHeight="100vh"
        bgcolor="background.default"
        p={{ xs: 2, md: 4 }}
      >
        {children}
      </Box>
    </>
  );
}
