export interface AuthenticatedIdentity {
  id: string;
  email: string;
  displayName: string;
}

// Swapped for a Google Workspace-backed implementation once real OAuth is
// wired in (BE-A-FR-010); the session/cookie mechanics stay unchanged.
export interface IdentityProvider {
  getIdentity(): Promise<AuthenticatedIdentity>;
}
