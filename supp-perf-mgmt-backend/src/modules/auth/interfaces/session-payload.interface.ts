export interface SessionPayload {
  sub: string;
  email: string;
  displayName: string;
  // epoch ms of the original login; anchors the 8-hour absolute cap independent
  // of the sliding-window `exp` claim jsonwebtoken manages on the token itself.
  sessionStart: number;
}
