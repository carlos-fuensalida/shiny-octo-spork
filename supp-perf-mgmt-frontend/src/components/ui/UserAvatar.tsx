'use client';

import { useState } from 'react';

import LogoutIcon from '@mui/icons-material/Logout';
import Avatar from '@mui/material/Avatar';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import type { User } from '@/types';

function getInitials(user: User): string {
  return user.displayName.slice(0, 2).toUpperCase();
}

interface UserAvatarProps {
  user?: User | null;
  size?: number;
}

export default function UserAvatar({ user, size = 32 }: UserAvatarProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  function handleLogout() {
    window.location.href = '/api/auth/logout';
  }

  return (
    <>
      <Avatar
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label={user ? `${user.displayName} avatar` : 'User avatar'}
        aria-controls={anchor ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={anchor ? 'true' : undefined}
        sx={(theme) => ({
          width: size,
          height: size,
          bgcolor: 'primary.contrastText',
          color: 'primary.main',
          fontSize: 20,
          fontWeight: 400,
          letterSpacing: '0.14px',
          cursor: 'pointer',
          transition: 'color 150ms, box-shadow 150ms',
          '&:hover': {
            color: 'primary.dark',
            boxShadow: `0 0 0 4px ${theme.palette.primary.dark}`,
          },
        })}
      >
        {user ? getInitials(user) : null}
      </Avatar>

      <Menu
        id="user-menu"
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 48, horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            elevation: 2,
            sx: { mt: 1, minWidth: 125, borderRadius: 1 },
          },
        }}
      >
        <MenuItem
          onClick={handleLogout}
          sx={{
            '&.Mui-focusVisible': { bgcolor: 'background.paper' },
            '&.Mui-focusVisible:hover': { bgcolor: 'action.hover' },
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="medium" />
          </ListItemIcon>
          <ListItemText
            slotProps={{
              primary: {
                sx: {
                  fontSize: 16,
                  lineHeight: 1.5,
                  letterSpacing: 0.15,
                },
              },
            }}
          >
            Log Out
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
