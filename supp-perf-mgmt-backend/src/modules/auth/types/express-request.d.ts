import 'express';
import { SessionPayload } from '../interfaces/session-payload.interface';

declare module 'express' {
  interface Request {
    user?: SessionPayload;
    sessionExpiresAt?: string;
  }
}
