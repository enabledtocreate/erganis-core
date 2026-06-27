export type AuthMode = 'oidc' | 'local' | 'both';
export type AuthProviderType = 'local' | 'oidc' | 'saml';

export interface AuthUser {
  publicId: string;
  email: string;
  displayName: string | null;
}

export interface AuthOrg {
  publicId: string;
  slug: string;
  name: string;
  authMode: AuthMode;
}

export interface AuthRole {
  name: string;
  permissions: string[];
  isAdmin: boolean;
}

export interface AuthSessionView {
  user: AuthUser;
  org: AuthOrg;
  role: AuthRole;
}

export interface OidcProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  issuer: string;
  displayName?: string;
}

export interface JwtClaims {
  sub: string;
  email: string;
  orgPublicId: string;
  role: string;
  permissions: string[];
}
