'use client';

import { useEffect, useState } from 'react';

import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function HeaderDate() {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;

    function scheduleNextMidnight() {
      const now = new Date();
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );
      id = setTimeout(() => {
        setToday(new Date());
        scheduleNextMidnight();
      }, midnight.getTime() - now.getTime());
    }

    scheduleNextMidnight();
    return () => clearTimeout(id);
  }, []);

  return (
    <Box display="flex" alignItems="center" gap={2}>
      <CalendarTodayIcon sx={{ fontSize: 16, color: 'inherit' }} />
      <Typography fontSize={13} color="inherit" suppressHydrationWarning>
        {formatDate(today)}
      </Typography>
    </Box>
  );
}
