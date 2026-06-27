import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';

describe('TokenService', () => {
  const config = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const values: Record<string, unknown> = {
        jwtSecret: 'test-secret',
        jwtTtlSeconds: 3600,
      };
      return values[key] ?? defaultValue;
    }),
  } as unknown as ConfigService;

  const service = new TokenService(config);

  it('signs and verifies access tokens', () => {
    const claims = {
      sub: 'user_01',
      email: 'a@b.com',
      orgPublicId: 'org_01',
      role: 'admin',
      permissions: [],
    };
    const token = service.signAccessToken(claims);
    expect(service.verifyAccessToken(token)).toEqual(
      expect.objectContaining(claims),
    );
  });

  it('signs and verifies OIDC state', () => {
    const state = service.signOidcState({ orgSlug: 'acme', nonce: 'abc' });
    expect(service.verifyOidcState(state)).toEqual(
      expect.objectContaining({
        orgSlug: 'acme',
        nonce: 'abc',
      }),
    );
  });

  it('throws when JWT secret is missing', () => {
    const noSecretConfig = {
      get: jest.fn(() => undefined),
    } as unknown as ConfigService;
    const noSecret = new TokenService(noSecretConfig);
    expect(() => noSecret.signAccessToken({
      sub: 'u',
      email: 'a@b.com',
      orgPublicId: 'o',
      role: 'admin',
      permissions: [],
    })).toThrow('JWT_SECRET is not configured');
  });
});
