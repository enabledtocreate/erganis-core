import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const tokens = {
    verifyAccessToken: jest.fn(),
  };
  const users = {
    findByPublicId: jest.fn(),
  };
  const guard = new JwtAuthGuard(tokens as never, users as never);

  const context = (authorization?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization },
        }),
      }),
    }) as never;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects missing bearer token', async () => {
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts valid token and attaches user ids', async () => {
    tokens.verifyAccessToken.mockReturnValue({ sub: 'user_pub_1' });
    users.findByPublicId.mockResolvedValue({ id: 'user-1', publicId: 'user_pub_1' });
    const req = { headers: { authorization: 'Bearer token-abc' } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as never;
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req).toMatchObject({ userId: 'user-1', userPublicId: 'user_pub_1' });
  });

  it('rejects invalid token', async () => {
    tokens.verifyAccessToken.mockImplementation(() => {
      throw new Error('invalid');
    });
    await expect(guard.canActivate(context('Bearer bad'))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
