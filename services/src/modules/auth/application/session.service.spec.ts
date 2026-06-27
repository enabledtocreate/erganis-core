import { ConfigService } from '@nestjs/config';
import { SessionService } from './session.service';
import { SessionRepository } from '../infrastructure/session.repository';

describe('SessionService', () => {
  const sessions = {
    createSession: jest.fn(),
    findValidSession: jest.fn(),
    deleteByToken: jest.fn(),
  } as unknown as SessionRepository;

  const config = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const values: Record<string, unknown> = {
        sessionTtlSeconds: 3600,
        sessionCookieName: 'erganis_session',
        nodeEnv: 'test',
      };
      return values[key] ?? defaultValue;
    }),
  } as unknown as ConfigService;

  const service = new SessionService(sessions, config);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a session with configured TTL', async () => {
    sessions.createSession = jest.fn().mockResolvedValue({ token: 'tok' });
    const token = await service.createSession('user-id');
    expect(token).toBe('tok');
    expect(sessions.createSession).toHaveBeenCalledWith(
      'user-id',
      expect.any(Date),
    );
  });

  it('resolves valid session token to user id', async () => {
    sessions.findValidSession = jest.fn().mockResolvedValue({ userId: 'u1' });
    await expect(service.resolveSessionToken('tok')).resolves.toBe('u1');
  });

  it('returns null for missing or invalid token', async () => {
    await expect(service.resolveSessionToken(undefined)).resolves.toBeNull();
    sessions.findValidSession = jest.fn().mockResolvedValue(null);
    await expect(service.resolveSessionToken('bad')).resolves.toBeNull();
  });

  it('revokes session when token provided', async () => {
    await service.revokeSession('tok');
    expect(sessions.deleteByToken).toHaveBeenCalledWith('tok');
  });

  it('exposes httpOnly cookie options', () => {
    expect(service.cookieName()).toBe('erganis_session');
    expect(service.cookieOptions()).toEqual(
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', secure: false }),
    );
  });
});
