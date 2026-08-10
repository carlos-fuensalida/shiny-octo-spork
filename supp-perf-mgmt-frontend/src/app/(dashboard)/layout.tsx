'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';

import AppHeader from '@/components/layout/AppHeader';
import AppNavigation from '@/components/layout/AppNavigation';
import ChatbotPanel from '@/components/layout/ChatbotPanel';

// Header 64px + Navigation 59px
const CONTENT_TOP = 'calc(var(--header-height) + var(--nav-height))';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <AppHeader />
      <AppNavigation />

      {/* Content area sits below the fixed header + nav */}
      <Box
        display="flex"
        flex={1}
        mt={CONTENT_TOP}
        minHeight={`calc(100vh - ${CONTENT_TOP})`}
      >
        {/* Main content */}
        <Box
          component="main"
          id="main-content"
          flex={1}
          minWidth={0}
          p="var(--content-padding)"
          bgcolor="background.default"
          overflow="auto"
        >
          {children}
        </Box>

        {/* Chatbot panel */}
        <ChatbotPanel sessionId={sessionId} onSessionChange={setSessionId} />
      </Box>
    </Box>
  );
}
