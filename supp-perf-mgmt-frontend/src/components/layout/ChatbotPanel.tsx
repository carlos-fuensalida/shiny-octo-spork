'use client';

import { useCallback, useState } from 'react';

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import ChatSuggestions from '@/components/ui/ChatSuggestions';
import { usePanelResize } from '@/hooks/usePanelResize';
import { sendChatMessage, startNewChatSession } from '@/services/chat.service';
import type { ChatScope } from '@/types';

const MIN_WIDTH_SM = 360;
const MIN_WIDTH_XL = 440;

interface ChatbotPanelProps {
  sessionId: string | null;
  onSessionChange: (id: string) => void;
  scope?: ChatScope;
  viewContext?: Record<string, unknown>;
}

export default function ChatbotPanel({
  sessionId,
  onSessionChange,
  scope = 'GLOBAL',
  viewContext,
}: ChatbotPanelProps) {
  const theme = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { width, isResizing, handleDragStart, panelRef } = usePanelResize({
    minWidthSm: MIN_WIDTH_SM,
    minWidthXl: MIN_WIDTH_XL,
  });

  // CSS variable (--chatpanel-default-width) owns the initial width so it
  // resolves correctly per viewport from the very first paint without JS.
  // Once the user drags, JS state takes over.
  const [hasUserResized, setHasUserResized] = useState(false);
  const onDragHandleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setHasUserResized(true);
      handleDragStart(e);
    },
    [handleDragStart],
  );

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; text: string }>
  >([]);
  const [loading, setLoading] = useState(false);

  async function handleSend(text: string) {
    if (!text.trim() || loading) return;
    const message = text.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setLoading(true);
    try {
      let sid = sessionId;
      if (!sid) {
        const session = await startNewChatSession();
        sid = session.sessionId;
        onSessionChange(sid);
      }
      const reply = await sendChatMessage({
        sessionId: sid,
        message,
        scope,
        viewContext,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: reply.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Unable to get a response. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <>
      <Box
        component="aside"
        aria-label="AI assistant"
        ref={panelRef as React.Ref<HTMLElement>}
        position="relative"
        flexShrink={0}
        height="100%"
        bgcolor="background.paper"
        borderLeft="1px solid"
        borderColor="divider"
        display="flex"
        flexDirection="column"
        overflow="hidden"
        sx={{
          // Use the CSS variable until the user drags — it resolves per-viewport
          // via a media query so the correct width is painted from the first frame.
          // After the user drags, JS state takes over for precise drag positioning.
          width: isCollapsed
            ? 0
            : hasUserResized
              ? width
              : 'var(--chatpanel-default-width)',
          // Disable transition during drag so the border tracks the mouse 1:1
          transition: isResizing
            ? 'none'
            : theme.transitions.create('width', {
                duration: theme.transitions.duration.standard,
                easing: theme.transitions.easing.easeInOut,
              }),
        }}
      >
        {/* ── Drag handle ─────────────────────────────────────────────────── */}
        <Box
          role="separator"
          aria-label="Resize chat panel"
          aria-orientation="vertical"
          onMouseDown={onDragHandleMouseDown}
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          width={8}
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1}
          sx={{
            cursor: 'col-resize',
            transition: 'background-color 150ms',
            '&:hover .resize-dots': { opacity: 1 },
            '&:active .resize-dots': { opacity: 1 },
          }}
        />

        {/* Fixed-width inner wrapper prevents content reflow during collapse animation */}
        <Box
          minWidth={MIN_WIDTH_SM}
          flex={1}
          display="flex"
          flexDirection="column"
          overflow="hidden"
          sx={{
            width: hasUserResized ? width : 'var(--chatpanel-default-width)',
          }}
        >
          {/* ── Header ────────────────────────────────────────────────────── */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            px="var(--content-padding)"
            pb={2}
            pt={4}
            borderBottom="1px solid"
            borderColor="divider"
          >
            <Box display="flex" alignItems="center" gap={3}>
              <Box
                width={36}
                height={36}
                borderRadius="50%"
                bgcolor="var(--color-amber)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <AutoAwesomeIcon
                  sx={{ fontSize: 18, color: 'background.paper' }}
                />
              </Box>

              <Box flex={1} minWidth={0}>
                <Typography
                  component="h3"
                  color="primary"
                  fontSize={{ sm: 20, xl: 24 }}
                  lineHeight={1.4}
                  noWrap
                >
                  Supplier AI Assistant
                </Typography>
                <Typography
                  color="secondary"
                  fontSize={{ sm: 12, xl: 14 }}
                  fontWeight={500}
                  lineHeight={1.2}
                >
                  Connected to live supplier performance data
                </Typography>
              </Box>
            </Box>

            <IconButton
              size="small"
              aria-label="Close assistant"
              onClick={() => setIsCollapsed(true)}
              sx={{ flexShrink: 0, color: 'text.secondary' }}
            >
              <CloseIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </Box>

          {/* ── Conversation / empty state ────────────────────────────────── */}
          <Box flex={1} overflow="auto" display="flex" flexDirection="column">
            {isEmpty ? (
              <ChatSuggestions scope={scope} onSelect={handleSend} />
            ) : (
              <Box flex={1} display="flex" flexDirection="column" gap={2} p={3}>
                {messages.map((msg, i) => (
                  <Box
                    key={i}
                    sx={{
                      alignSelf:
                        msg.role === 'user' ? 'flex-end' : 'flex-start',
                      bgcolor:
                        msg.role === 'user'
                          ? 'primary.main'
                          : 'background.default',
                      color:
                        msg.role === 'user'
                          ? 'primary.contrastText'
                          : 'text.primary',
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      maxWidth: '85%',
                    }}
                  >
                    <Typography variant="body2">{msg.text}</Typography>
                  </Box>
                ))}
                {loading && (
                  <Typography variant="body2" color="text.secondary">
                    Thinking…
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* ── Input area ──────────────────────────────────────────────────── */}
          <Box
            px="var(--content-padding)"
            pt={1.5}
            pb={2}
            borderTop="1px solid"
            borderColor="divider"
          >
            <TextField
              fullWidth
              placeholder="Ask about supplier KPIs, risks or trends…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              disabled={loading}
              size="small"
              slotProps={{
                htmlInput: { 'aria-label': 'Chat message input' },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Send message"
                        onClick={() => handleSend(input)}
                        disabled={!input.trim() || loading}
                        sx={(theme) => ({
                          bgcolor: 'secondary.main',
                          color: 'common.white',
                          borderRadius: 2,
                          width: 32,
                          height: 32,
                          [theme.breakpoints.up('xl')]: {
                            width: 48,
                            height: 48,
                          },
                          '&:hover': { bgcolor: 'secondary.dark' },
                          '&.Mui-disabled': {
                            bgcolor: 'action.disabledBackground',
                            color: 'action.disabled',
                          },
                        })}
                      >
                        <SendIcon
                          sx={(theme) => ({
                            fontSize: 16,
                            [theme.breakpoints.up('xl')]: { fontSize: 24 },
                          })}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={(theme) => ({
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  fontSize: 13,
                  pr: 1.5,
                  height: 44,
                  [theme.breakpoints.up('xl')]: {
                    height: 62,
                  },
                },
              })}
            />

            <Typography
              display="block"
              fontSize={{ sm: 10, xl: 12 }}
              color="text.secondary"
              textAlign="center"
              mt={1}
              lineHeight={1.5}
            >
              Responses are generated from your supplier performance data.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── FAB — visible when panel is collapsed ────────────────────────── */}
      <Fade in={isCollapsed} unmountOnExit>
        <Fab
          aria-label="Open AI assistant"
          onClick={() => setIsCollapsed(false)}
          sx={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            bgcolor: 'var(--color-amber)',
            color: 'common.white',
            zIndex: theme.zIndex.fab,
            boxShadow: 4,
            '&:hover': { bgcolor: 'var(--color-amber-mid)' },
          }}
        >
          <AutoAwesomeIcon />
        </Fab>
      </Fade>
    </>
  );
}
