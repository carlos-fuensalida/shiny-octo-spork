import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function PpmPage() {
  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        PPM Monthly Report
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Global Supplier Development · Rolling 3-Month View
      </Typography>
      <Typography variant="body2" color="secondary" sx={{ mt: 2 }}>
        PPM detail — implementation pending
      </Typography>
    </Box>
  );
}
