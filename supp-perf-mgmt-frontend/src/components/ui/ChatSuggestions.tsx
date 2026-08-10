'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import type { ChatScope } from '@/types';

const SUGGESTION_CHIPS = [
  'Why is quality at risk?',
  'Draft an escalation email for GKN',
  'Which contracts expire soon?',
  'Summarize delivery performance',
];

interface ChatSuggestionsProps {
  scope: ChatScope;
  onSelect: (text: string) => void;
}

export default function ChatSuggestions({
  scope,
  onSelect,
}: ChatSuggestionsProps) {
  return (
    <Box
      flex={1}
      display="flex"
      flexDirection="column"
      px="var(--content-padding)"
      py={3}
    >
      <Box
        flex={1}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        gap={2}
        pb={2}
        pt={6}
      >
        <Typography
          color="primary"
          fontSize={{ sm: 28, xl: 34 }}
          lineHeight={1.2}
          letterSpacing={0.25}
        >
          How can I help you?
        </Typography>
        <Typography
          color="secondary"
          fontSize={{ sm: 12, xl: 14 }}
          fontWeight={500}
          lineHeight={1.5}
          letterSpacing={0.1}
          width={{ sm: 300, xl: 350 }}
        >
          Ask about quality, delivery, spend or risk
          {scope === 'CURRENT_VIEW'
            ? ' in this view.'
            : ' across all suppliers.'}
        </Typography>
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        alignItems="start"
        gap={{ sm: 1.5, xl: 3 }}
      >
        {SUGGESTION_CHIPS.map((label) => (
          <Chip
            key={label}
            label={label}
            variant="outlined"
            clickable
            onClick={() => onSelect(label)}
            sx={{
              justifyContent: 'flex-start',
              borderRadius: 5,
              fontSize: 13,
              lineHeight: '18px',
              letterSpacing: '0.16px',
              p: 1,
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'transparent',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
