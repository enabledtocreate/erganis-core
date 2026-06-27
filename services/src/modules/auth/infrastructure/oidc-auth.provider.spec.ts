import {
  HttpOidcAuthProvider,
  MockOidcAuthProvider,
} from './oidc-auth.provider';
import { OrgOidcConfigRecord } from './org.repository';

const config: OrgOidcConfigRecord = {
  orgId: 'org-1',
  issuer: 'https://idp.test',
  clientId: 'client',
  clientSecret: 'secret',
  scopes: 'openid email profile',
  authorizationEndpoint: 'https://idp.test/authorize',
  tokenEndpoint: 'https://idp.test/token',
  jwksUri: null,
};

describe('MockOidcAuthProvider', () => {
  const provider = new MockOidcAuthProvider();

  it('builds authorization URL with state and redirect', () => {
    const url = provider.buildAuthorizationUrl(config, 'state123', 'http://app/cb');
    expect(url).toContain('client_id=client');
    expect(url).toContain('state=state123');
    expect(url).toContain('redirect_uri=http%3A%2F%2Fapp%2Fcb');
  });

  it('exchanges mock code for profile', async () => {
    const profile = await provider.exchangeCode(
      config,
      'mock-code:alice@acme.com',
      'http://app/cb',
    );
    expect(profile.email).toBe('alice@acme.com');
    expect(profile.sub).toBe('mock-alice@acme.com');
    expect(profile.issuer).toBe('https://mock-idp.test');
  });

  it('rejects invalid mock code', async () => {
    await expect(provider.exchangeCode(config, 'bad-code', 'http://app/cb')).rejects.toThrow(
      'Invalid mock OIDC code',
    );
  });
});

describe('HttpOidcAuthProvider', () => {
  const provider = new HttpOidcAuthProvider();

  it('builds authorization URL with required params', () => {
    const url = provider.buildAuthorizationUrl(config, 'state123', 'http://app/cb');
    expect(url).toContain('scope=openid+email+profile');
    expect(url).toContain('nonce=');
  });

  it('throws when authorization endpoint missing', () => {
    expect(() =>
      provider.buildAuthorizationUrl(
        { ...config, authorizationEndpoint: null },
        's',
        'http://app/cb',
      ),
    ).toThrow('OIDC authorization endpoint is not configured');
  });

  it('exchanges code via token endpoint', async () => {
    const payload = Buffer.from(
      JSON.stringify({
        sub: 'sub-1',
        email: 'bob@acme.com',
        email_verified: true,
        iss: 'https://idp.test',
        name: 'Bob',
      }),
    ).toString('base64url');
    const idToken = `header.${payload}.sig`;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id_token: idToken }),
    }) as jest.Mock;

    const profile = await provider.exchangeCode(config, 'code', 'http://app/cb');
    expect(profile.email).toBe('bob@acme.com');
    expect(profile.displayName).toBe('Bob');
  });
});
