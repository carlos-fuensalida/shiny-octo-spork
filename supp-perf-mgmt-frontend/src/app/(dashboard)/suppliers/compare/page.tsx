import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function SupplierComparePage() {
  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Active Suppliers
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Select two suppliers to compare their performance across key metrics.
      </Typography>
      <Typography variant="body2" color="secondary" sx={{ mt: 2 }}>
        Supplier Comparison — implementation pending
      </Typography>
    </Box>
  );
}
