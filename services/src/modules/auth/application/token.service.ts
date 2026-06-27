import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';
import { JwtClaims } from '@erganis/platform';

export interface OidcStatePayload {
  orgSlug: string;
  nonce: string;
}

@Injectable()
export class TokenService {
  constructor(private readonly config: ConfigService) {}

  signAccessToken(claims: JwtClaims): string {
    return jwt.sign(claims, this.secret(), {
      expiresIn: this.config.get<number>('jwtTtlSeconds', 3600),
    });
  }

  verifyAccessToken(token: string): JwtClaims {
    return jwt.verify(token, this.secret()) as JwtClaims;
  }

  signOidcState(payload: OidcStatePayload): string {
    return jwt.sign(payload, this.secret(), { expiresIn: 600 });
  }

  verifyOidcState(state: string): OidcStatePayload {
    return jwt.verify(state, this.secret()) as OidcStatePayload;
  }

  private secret(): string {
    const secret = this.config.get<string>('jwtSecret');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    return secret;
  }
}
