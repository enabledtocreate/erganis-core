import { Injectable } from '@nestjs/common';
import { OidcProfile } from '@erganis/platform';
import { OrgOidcConfigRecord } from '../infrastructure/org.repository';
import { randomBytes } from 'crypto';

export const OIDC_AUTH_PROVIDER = Symbol('OIDC_AUTH_PROVIDER');

export interface OidcAuthProvider {
  buildAuthorizationUrl(
    config: OrgOidcConfigRecord,
    state: string,
    redirectUri: string,
  ): string;
  exchangeCode(
    config: OrgOidcConfigRecord,
    code: string,
    redirectUri: string,
  ): Promise<OidcProfile>;
}

@Injectable()
export class MockOidcAuthProvider implements OidcAuthProvider {
  buildAuthorizationUrl(
    config: OrgOidcConfigRecord,
    state: string,
    redirectUri: string,
  ): string {
    const base = config.authorizationEndpoint ?? 'http://mock-idp/authorize';
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      state,
      response_type: 'code',
    });
    return `${base}?${params.toString()}`;
  }

  async exchangeCode(
    _config: OrgOidcConfigRecord,
    code: string,
    _redirectUri: string,
  ): Promise<OidcProfile> {
    const match = /^mock-code:(.+@.+)$/.exec(code);
    if (!match) {
      throw new Error('Invalid mock OIDC code');
    }
    const email = match[1].toLowerCase();
    return {
      sub: `mock-${email}`,
      email,
      emailVerified: true,
      issuer: 'https://mock-idp.test',
      displayName: email.split('@')[0],
    };
  }
}

@Injectable()
export class HttpOidcAuthProvider implements OidcAuthProvider {
  buildAuthorizationUrl(
    config: OrgOidcConfigRecord,
    state: string,
    redirectUri: string,
  ): string {
    if (!config.authorizationEndpoint) {
      throw new Error('OIDC authorization endpoint is not configured');
    }
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.scopes,
      state,
      nonce: randomBytes(16).toString('hex'),
    });
    return `${config.authorizationEndpoint}?${params.toString()}`;
  }

  async exchangeCode(
    config: OrgOidcConfigRecord,
    code: string,
    redirectUri: string,
  ): Promise<OidcProfile> {
    if (!config.tokenEndpoint) {
      throw new Error('OIDC token endpoint is not configured');
    }
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });
    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) {
      throw new Error(`OIDC token exchange failed: ${response.status}`);
    }
    const json = (await response.json()) as { id_token?: string };
    if (!json.id_token) {
      throw new Error('OIDC token response missing id_token');
    }
    const payload = JSON.parse(
      Buffer.from(json.id_token.split('.')[1], 'base64url').toString('utf8'),
    ) as {
      sub: string;
      email?: string;
      email_verified?: boolean;
      iss: string;
      name?: string;
    };
    if (!payload.email) {
      throw new Error('OIDC id_token missing email claim');
    }
    return {
      sub: payload.sub,
      email: payload.email.toLowerCase(),
      emailVerified: payload.email_verified ?? false,
      issuer: payload.iss ?? config.issuer,
      displayName: payload.name,
    };
  }
}
