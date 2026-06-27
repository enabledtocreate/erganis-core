import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionService } from '../application/session.service';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  sessionToken?: string;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = req.cookies?.[this.sessions.cookieName()] as string | undefined;
    const userId = await this.sessions.resolveSessionToken(token);
    if (!userId) {
      throw new UnauthorizedException('Authentication required');
    }
    req.userId = userId;
    req.sessionToken = token;
    return true;
  }
}
