export const SESSION_COOKIE_NAME = 'spms_session';

// 60-minute sliding window, reissued on every authenticated request.
export const SESSION_SLIDING_WINDOW_SECONDS = 60 * 60;

// 8-hour absolute cap from the original login, regardless of activity.
export const SESSION_ABSOLUTE_CAP_MS = 8 * 60 * 60 * 1000;

export const IDENTITY_PROVIDER = Symbol('IDENTITY_PROVIDER');
