import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces';
import { SessionGuard } from './session.guard';
import { SessionService } from '../application/session.service';

describe('SessionGuard', () => {
  const sessions = {
    cookieName: jest.fn().mockReturnValue('erganis_session'),
    resolveSessionToken: jest.fn(),
  } as unknown as SessionService;

  const guard = new SessionGuard(sessions);

  function contextWithCookies(cookies: Record<string, string>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ cookies }),
      }),
    } as ExecutionContext;
  }

  it('allows request with valid session', async () => {
    sessions.resolveSessionToken = jest.fn().mockResolvedValue('user-id');
    const req = { cookies: { erganis_session: 'tok' } };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as ExecutionContext;
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req).toHaveProperty('userId', 'user-id');
  });

  it('rejects request without valid session', async () => {
    sessions.resolveSessionToken = jest.fn().mockResolvedValue(null);
    await expect(guard.canActivate(contextWithCookies({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
