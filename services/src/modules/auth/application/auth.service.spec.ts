import { ConfigService } from '@nestjs/config';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DomainJitService } from './domain-jit.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { OrgRepository } from '../infrastructure/org.repository';
import { UserRepository } from '../infrastructure/user.repository';
import { MembershipRepository } from '../infrastructure/membership.repository';
import { IdentityRepository } from '../infrastructure/identity.repository';
import { OidcAuthProvider } from '../infrastructure/oidc-auth.provider';

describe('AuthService', () => {
  const org = {
    id: 'org-id',
    publicId: 'org_abc',
    slug: 'acme',
    name: 'Acme',
    allowedDomains: ['acme.com'],
    authMode: 'both' as const,
  };

  const user = {
    id: 'user-id',
    publicId: 'user_abc',
    email: 'admin@acme.com',
    passwordHash: 'hash',
    displayName: 'Admin',
  };

  const membership = {
    role: { id: 'r1', orgId: 'org-id', name: 'admin', permissions: [], isAdmin: true },
  };

  const orgs = {
    findBySlug: jest.fn(),
    findOidcConfig: jest.fn(),
    ensureAdminRole: jest.fn(),
  } as unknown as OrgRepository;

  const users = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    createUser: jest.fn(),
    updateDisplayName: jest.fn(),
  } as unknown as UserRepository;

  const memberships = {
    findMembership: jest.fn(),
    addMembership: jest.fn(),
  } as unknown as MembershipRepository;

  const identities = {
    findByIssuerSubject: jest.fn(),
    linkIdentity: jest.fn(),
  } as unknown as IdentityRepository;

  const domainJit = new DomainJitService();
  const passwords = {
    verify: jest.fn(),
    hash: jest.fn(),
  } as unknown as PasswordService;

  const sessions = {
    createSession: jest.fn(),
    resolveSessionToken: jest.fn(),
    revokeSession: jest.fn(),
  } as unknown as SessionService;

  const tokens = {
    signAccessToken: jest.fn().mockReturnValue('jwt-token'),
    signOidcState: jest.fn().mockReturnValue('state-token'),
    verifyOidcState: jest.fn().mockReturnValue({ orgSlug: 'acme', nonce: 'n' }),
  } as unknown as TokenService;

  const oidc = {
    buildAuthorizationUrl: jest.fn().mockReturnValue('https://idp/authorize'),
    exchangeCode: jest.fn(),
  } as unknown as OidcAuthProvider;

  const config = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const values: Record<string, unknown> = {
        authLocalEnabled: true,
        oidcCallbackBaseUrl: 'http://localhost:5000',
        jwtTtlSeconds: 3600,
      };
      return values[key] ?? defaultValue;
    }),
  } as unknown as ConfigService;

  const service = new AuthService(
    orgs,
    users,
    memberships,
    identities,
    domainJit,
    passwords,
    sessions,
    tokens,
    config,
    oidc,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    orgs.findBySlug = jest.fn().mockResolvedValue(org);
    users.findByEmail = jest.fn().mockResolvedValue(user);
    users.findById = jest.fn().mockResolvedValue(user);
    passwords.verify = jest.fn().mockResolvedValue(true);
    memberships.findMembership = jest.fn().mockResolvedValue(membership);
    sessions.createSession = jest.fn().mockResolvedValue('session-tok');
  });

  it('loginLocal creates session for valid credentials', async () => {
    const result = await service.loginLocal('acme', 'admin@acme.com', 'pass');
    expect(result.sessionToken).toBe('session-tok');
    expect(result.view.user.email).toBe('admin@acme.com');
  });

  it('loginLocal rejects invalid password', async () => {
    passwords.verify = jest.fn().mockResolvedValue(false);
    await expect(service.loginLocal('acme', 'admin@acme.com', 'bad')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('loginLocal rejects when local auth disabled', async () => {
    config.get = jest.fn().mockReturnValue(false);
    const disabled = new AuthService(
      orgs, users, memberships, identities, domainJit, passwords,
      sessions, tokens, config, oidc,
    );
    await expect(disabled.loginLocal('acme', 'a@b.com', 'p')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    config.get = jest.fn((key: string, defaultValue?: unknown) => {
      const values: Record<string, unknown> = {
        authLocalEnabled: true,
        oidcCallbackBaseUrl: 'http://localhost:5000',
        jwtTtlSeconds: 3600,
      };
      return values[key] ?? defaultValue;
    });
  });

  it('startOidcLogin returns authorization URL', async () => {
    orgs.findOidcConfig = jest.fn().mockResolvedValue({
      orgId: 'org-id',
      issuer: 'https://idp',
      clientId: 'c',
      clientSecret: 's',
      scopes: 'openid email',
      authorizationEndpoint: 'https://idp/auth',
      tokenEndpoint: null,
      jwksUri: null,
    });
    const result = await service.startOidcLogin('acme');
    expect(result.authorizationUrl).toContain('https://idp');
    expect(result.state).toBe('state-token');
  });

  it('completeOidcLogin provisions user via domain JIT', async () => {
    orgs.findOidcConfig = jest.fn().mockResolvedValue({
      orgId: 'org-id',
      issuer: 'https://mock-idp.test',
      clientId: 'c',
      clientSecret: 's',
      scopes: 'openid email',
      authorizationEndpoint: 'https://idp/auth',
      tokenEndpoint: null,
      jwksUri: null,
    });
    oidc.exchangeCode = jest.fn().mockResolvedValue({
      sub: 'mock-new@acme.com',
      email: 'new@acme.com',
      emailVerified: true,
      issuer: 'https://mock-idp.test',
      displayName: 'new',
    });
    identities.findByIssuerSubject = jest.fn().mockResolvedValue(null);
    users.findByEmail = jest.fn().mockResolvedValue(null);
    memberships.findMembership = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(membership);
    users.createUser = jest.fn().mockResolvedValue({
      ...user,
      id: 'new-user',
      email: 'new@acme.com',
    });
    users.findById = jest.fn().mockResolvedValue({
      ...user,
      id: 'new-user',
      email: 'new@acme.com',
    });
    orgs.ensureAdminRole = jest.fn().mockResolvedValue(membership.role);

    const result = await service.completeOidcLogin('acme', 'code', 'state-token');
    expect(identities.linkIdentity).toHaveBeenCalled();
    expect(memberships.addMembership).toHaveBeenCalled();
    expect(result.sessionToken).toBe('session-tok');
  });

  it('issueJwtFromSession returns signed token', async () => {
    sessions.resolveSessionToken = jest.fn().mockResolvedValue('user-id');
    const result = await service.issueJwtFromSession('sess', 'acme');
    expect(result.accessToken).toBe('jwt-token');
    expect(result.expiresIn).toBe(3600);
  });
});
