import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionRepository } from '../infrastructure/session.repository';

@Injectable()
export class SessionService {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly config: ConfigService,
  ) {}

  async createSession(userId: string): Promise<string> {
    const ttl = this.config.get<number>('sessionTtlSeconds', 86400);
    const expiresAt = new Date(Date.now() + ttl * 1000);
    const { token } = await this.sessions.createSession(userId, expiresAt);
    return token;
  }

  async resolveSessionToken(token: string | undefined): Promise<string | null> {
    if (!token) {
      return null;
    }
    const session = await this.sessions.findValidSession(token);
    return session?.userId ?? null;
  }

  async revokeSession(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }
    await this.sessions.deleteByToken(token);
  }

  cookieName(): string {
    return this.config.get<string>('sessionCookieName', 'erganis_session');
  }

  cookieOptions(): {
    httpOnly: boolean;
    sameSite: 'lax';
    secure: boolean;
    maxAge: number;
  } {
    const ttl = this.config.get<number>('sessionTtlSeconds', 86400);
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get<string>('nodeEnv') === 'production',
      maxAge: ttl * 1000,
    };
  }

  clearCookieOptions(): {
    httpOnly: boolean;
    sameSite: 'lax';
    secure: boolean;
  } {
    const base = this.cookieOptions();
    return {
      httpOnly: base.httpOnly,
      sameSite: base.sameSite,
      secure: base.secure,
    };
  }
}
