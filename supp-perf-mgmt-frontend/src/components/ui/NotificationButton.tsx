import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';

interface NotificationButtonProps {
  count?: number;
}

export default function NotificationButton({
  count = 0,
}: NotificationButtonProps) {
  return (
    <IconButton
      aria-label={`${count} notifications`}
      size="small"
      color="inherit"
      sx={{ '&:hover': { bgcolor: 'primary.dark' } }}
    >
      <Badge
        badgeContent={count}
        color="error"
        sx={{ '& .MuiBadge-badge': { fontSize: 12, letterSpacing: '0.14px' } }}
      >
        <NotificationsIcon sx={{ fontSize: 28 }} />
      </Badge>
    </IconButton>
  );
}
