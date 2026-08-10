'use client';

import Image from 'next/image';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import HeaderDate from '@/components/ui/HeaderDate';
import NotificationButton from '@/components/ui/NotificationButton';
import UserAvatar from '@/components/ui/UserAvatar';
import { useUser } from '@/context/UserContext';

interface AppHeaderProps {
  notificationCount?: number;
}

export default function AppHeader({ notificationCount = 5 }: AppHeaderProps) {
  const { user } = useUser();
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        height: 'var(--header-height)',
        justifyContent: 'center',
        zIndex: (t) => t.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          gap: 4.5,
          px: 'var(--content-padding)',
          minHeight: 'var(--header-height) !important',
        }}
      >
        <Box display="flex" alignItems="center" gap={3}>
          <Image
            src="/Whirlpool_Corporation_Logo.svg"
            height={30}
            width={90}
            alt="Whirlpool Corporation Logo"
          />

          <Typography
            variant="h3"
            component="h1"
            fontWeight={400}
            lineHeight={1.75}
            letterSpacing="0.15px"
            flexGrow={0}
            borderLeft="1px solid currentColor"
            pl={3}
          >
            Supplier Performance Management
          </Typography>
        </Box>

        <Box flexGrow={1} />

        <HeaderDate />
        <NotificationButton count={notificationCount} />
        <UserAvatar user={user} />
      </Toolbar>
    </AppBar>
  );
}
