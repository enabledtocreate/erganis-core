import { randomBytes } from 'crypto';
import {
  ForbiddenException,
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthSessionView, JwtClaims, OidcProfile } from '@erganis/platform';
import { DomainJitService } from './domain-jit.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { OrgRepository } from '../infrastructure/org.repository';
import { UserRepository, UserRecord } from '../infrastructure/user.repository';
import { MembershipRepository } from '../infrastructure/membership.repository';
import { IdentityRepository } from '../infrastructure/identity.repository';
import {
  OIDC_AUTH_PROVIDER,
  OidcAuthProvider,
} from '../infrastructure/oidc-auth.provider';

export interface LoginResult {
  sessionToken: string;
  view: AuthSessionView;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly orgs: OrgRepository,
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
    private readonly identities: IdentityRepository,
    private readonly domainJit: DomainJitService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService,
    @Inject(OIDC_AUTH_PROVIDER) private readonly oidc: OidcAuthProvider,
  ) {}

  async loginLocal(
    orgSlug: string,
    email: string,
    password: string,
  ): Promise<LoginResult> {
    if (!this.config.get<boolean>('authLocalEnabled')) {
      throw new ForbiddenException('Local login is disabled');
    }

    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      this.logger.warn(`Local login failed: unknown org slug=${orgSlug}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    if (org.authMode === 'oidc') {
      this.logger.warn(`Local login rejected: org requires OIDC slug=${orgSlug}`);
      throw new ForbiddenException('Organization requires OIDC login');
    }

    const user = await this.users.findByEmail(email);
    if (!user) {
      this.logger.warn(`Local login failed: unknown user email=${email} org=${orgSlug}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwords.verify(password, user.passwordHash);
    if (!valid) {
      this.logger.warn(`Local login failed: bad password email=${email} org=${orgSlug}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const membership = await this.memberships.findMembership(org.id, user.id);
    if (!membership) {
      this.logger.warn(
        `Local login failed: user not in org email=${email} org=${orgSlug}`,
      );
      throw new ForbiddenException('User is not a member of this organization');
    }

    const sessionToken = await this.sessions.createSession(user.id);
    const view = await this.buildSessionView(user.id, orgSlug);
    this.logger.log(`Local login success email=${email} org=${orgSlug}`);
    return { sessionToken, view };
  }

  async startOidcLogin(
    orgSlug: string,
  ): Promise<{ authorizationUrl: string; state: string }> {
    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      throw new UnauthorizedException('Organization not found');
    }
    if (org.authMode === 'local') {
      throw new ForbiddenException('Organization does not support OIDC');
    }

    const oidcConfig = await this.orgs.findOidcConfig(org.id);
    if (!oidcConfig) {
      throw new ForbiddenException('OIDC is not configured for this organization');
    }

    const state = this.tokens.signOidcState({
      orgSlug,
      nonce: cryptoRandom(),
    });
    const redirectUri = this.oidcCallbackUrl(orgSlug);
    const authorizationUrl = this.oidc.buildAuthorizationUrl(
      oidcConfig,
      state,
      redirectUri,
    );
    return { authorizationUrl, state };
  }

  async completeOidcLogin(
    orgSlug: string,
    code: string,
    state: string,
  ): Promise<LoginResult> {
    const payload = this.tokens.verifyOidcState(state);
    if (payload.orgSlug !== orgSlug) {
      throw new UnauthorizedException('Invalid OIDC state');
    }

    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      throw new UnauthorizedException('Organization not found');
    }

    const oidcConfig = await this.orgs.findOidcConfig(org.id);
    if (!oidcConfig) {
      throw new ForbiddenException('OIDC is not configured');
    }

    const profile = await this.oidc.exchangeCode(
      oidcConfig,
      code,
      this.oidcCallbackUrl(orgSlug),
    );

    const user = await this.resolveOidcUser(org, profile);
    const sessionToken = await this.sessions.createSession(user.id);
    const view = await this.buildSessionView(user.id, orgSlug);
    return { sessionToken, view };
  }

  async resolveOidcUser(
    org: Awaited<ReturnType<OrgRepository['findBySlug']>>,
    profile: OidcProfile,
  ): Promise<UserRecord> {
    if (!org) {
      throw new UnauthorizedException('Organization not found');
    }

    if (!this.domainJit.isDomainAllowed(profile.email, org.allowedDomains)) {
      throw new ForbiddenException('Email domain is not allowed for this organization');
    }

    const linked = await this.identities.findByIssuerSubject(
      profile.issuer,
      profile.sub,
    );
    if (linked) {
      const user = await this.users.findById(linked.userId);
      if (!user) {
        throw new UnauthorizedException('Linked user not found');
      }
      await this.ensureMembership(org.id, user.id);
      return user;
    }

    let user = await this.users.findByEmail(profile.email);
    if (!user) {
      user = await this.users.createUser({
        email: profile.email,
        displayName: profile.displayName ?? null,
      });
    } else if (profile.displayName && !user.displayName) {
      await this.users.updateDisplayName(user.id, profile.displayName);
      user = (await this.users.findById(user.id))!;
    }

    await this.identities.linkIdentity(user.id, profile.issuer, profile.sub);
    await this.ensureMembership(org.id, user.id);
    return user;
  }

  async buildSessionView(userId: string, orgSlug: string): Promise<AuthSessionView> {
    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      throw new UnauthorizedException('Organization not found');
    }
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const membership = await this.memberships.findMembership(org.id, user.id);
    if (!membership) {
      throw new ForbiddenException('User is not a member of this organization');
    }

    return {
      user: {
        publicId: user.publicId,
        email: user.email,
        displayName: user.displayName,
      },
      org: {
        publicId: org.publicId,
        slug: org.slug,
        name: org.name,
        authMode: org.authMode,
      },
      role: {
        name: membership.role.name,
        permissions: membership.role.permissions,
        isAdmin: membership.role.isAdmin,
      },
    };
  }

  async getSessionViewFromToken(
    sessionToken: string | undefined,
    orgSlug: string,
  ): Promise<AuthSessionView> {
    const userId = await this.sessions.resolveSessionToken(sessionToken);
    if (!userId) {
      throw new UnauthorizedException('Session expired or invalid');
    }
    return this.buildSessionView(userId, orgSlug);
  }

  async logout(sessionToken: string | undefined): Promise<void> {
    await this.sessions.revokeSession(sessionToken);
  }

  async issueJwtFromSession(
    sessionToken: string | undefined,
    orgSlug: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const view = await this.getSessionViewFromToken(sessionToken, orgSlug);
    const claims: JwtClaims = {
      sub: view.user.publicId,
      email: view.user.email,
      orgPublicId: view.org.publicId,
      role: view.role.name,
      permissions: view.role.permissions,
    };
    return {
      accessToken: this.tokens.signAccessToken(claims),
      expiresIn: this.config.get<number>('jwtTtlSeconds', 3600),
    };
  }

  async issueJwtFromLocalLogin(
    orgSlug: string,
    email: string,
    password: string,
  ): Promise<{ accessToken: string; expiresIn: number; sessionToken: string }> {
    const login = await this.loginLocal(orgSlug, email, password);
    const claims: JwtClaims = {
      sub: login.view.user.publicId,
      email: login.view.user.email,
      orgPublicId: login.view.org.publicId,
      role: login.view.role.name,
      permissions: login.view.role.permissions,
    };
    return {
      accessToken: this.tokens.signAccessToken(claims),
      expiresIn: this.config.get<number>('jwtTtlSeconds', 3600),
      sessionToken: login.sessionToken,
    };
  }

  private async ensureMembership(orgId: string, userId: string): Promise<void> {
    const existing = await this.memberships.findMembership(orgId, userId);
    if (existing) {
      return;
    }
    const adminRole = await this.orgs.ensureAdminRole(orgId);
    await this.memberships.addMembership(orgId, userId, adminRole.id);
  }

  private oidcCallbackUrl(orgSlug: string): string {
    const base = this.config.get<string>('oidcCallbackBaseUrl', 'http://localhost:5000');
    return `${base.replace(/\/$/, '')}/auth/oidc/${orgSlug}/callback`;
  }
}

function cryptoRandom(): string {
  return randomBytes(16).toString('hex');
}
