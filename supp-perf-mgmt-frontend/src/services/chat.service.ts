import type { ChatMessage, ChatReply, ChatSession } from '@/types';

import { chatApi } from './http';

export async function sendChatMessage(
  payload: ChatMessage,
): Promise<ChatReply> {
  return chatApi.post<ChatReply>('/chat/message', payload);
}

export async function startNewChatSession(
  previousSessionId?: string,
): Promise<ChatSession> {
  return chatApi.post<ChatSession>('/chat/session/new', { previousSessionId });
}
