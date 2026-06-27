import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from '../application/auth.service';
import { SessionService } from '../application/session.service';

describe('AuthController', () => {
  let controller: AuthController;
  const auth = {
    loginLocal: jest.fn(),
    startOidcLoginAsync: jest.fn(),
    completeOidcLogin: jest.fn(),
    logout: jest.fn(),
    buildSessionView: jest.fn(),
    issueJwtFromSession: jest.fn(),
    issueJwtFromLocalLogin: jest.fn(),
  };
  const sessions = {
    cookieName: jest.fn().mockReturnValue('erganis_session'),
    cookieOptions: jest.fn().mockReturnValue({ httpOnly: true }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: SessionService, useValue: sessions },
      ],
    }).compile();
    controller = module.get(AuthController);
  });

  it('localLogin sets session cookie and returns view', async () => {
    auth.loginLocal.mockResolvedValue({
      sessionToken: 'tok',
      view: { user: { email: 'a@b.com' } },
    });
    const res = { cookie: jest.fn() };
    const view = await controller.localLogin(
      'acme',
      { email: 'a@b.com', password: 'p' },
      res as never,
    );
    expect(view.user.email).toBe('a@b.com');
    expect(res.cookie).toHaveBeenCalledWith('erganis_session', 'tok', expect.any(Object));
  });

  it('issueToken uses session cookie when present', async () => {
    auth.issueJwtFromSession.mockResolvedValue({ accessToken: 'jwt', expiresIn: 3600 });
    const req = { cookies: { erganis_session: 'sess' } };
    const result = await controller.issueToken(
      { orgSlug: 'acme' },
      req as never,
      { cookie: jest.fn() } as never,
    );
    expect(result).toEqual({ accessToken: 'jwt', expiresIn: 3600 });
  });

  it('issueToken throws when no credentials provided', async () => {
    await expect(
      controller.issueToken(
        { orgSlug: 'acme' },
        { cookies: {} } as never,
        { cookie: jest.fn() } as never,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
