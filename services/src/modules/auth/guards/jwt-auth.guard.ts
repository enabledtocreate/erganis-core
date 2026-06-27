import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from '../application/token.service';
import { UserRepository } from '../infrastructure/user.repository';

export interface JwtAuthenticatedRequest extends Request {
  userId?: string;
  userPublicId?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly users: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<JwtAuthenticatedRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token required');
    }
    const token = header.slice(7);
    let claims;
    try {
      claims = this.tokens.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    if (!claims?.sub) {
      throw new UnauthorizedException('Invalid token');
    }
    const user = await this.users.findByPublicId(claims.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    req.userId = user.id;
    req.userPublicId = user.publicId;
    return true;
  }
}
