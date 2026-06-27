import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../application/auth.service';
import { SessionService } from '../application/session.service';
import { AuthenticatedRequest, SessionGuard } from '../guards/session.guard';

class LocalLoginDto {
  email!: string;
  password!: string;
}

class TokenRequestDto {
  orgSlug!: string;
  email?: string;
  password?: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Post('local/:orgSlug/login')
  async localLogin(
    @Param('orgSlug') orgSlug: string,
    @Body() body: LocalLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.loginLocal(orgSlug, body.email, body.password);
    this.setSessionCookie(res, result.sessionToken);
    return result.view;
  }

  @Get('oidc/:orgSlug/start')
  async oidcStart(@Param('orgSlug') orgSlug: string) {
    return this.auth.startOidcLogin(orgSlug);
  }

  @Get('oidc/:orgSlug/callback')
  async oidcCallback(
    @Param('orgSlug') orgSlug: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.completeOidcLogin(orgSlug, code, state);
    this.setSessionCookie(res, result.sessionToken);
    return result.view;
  }

  @Post('logout')
  @UseGuards(SessionGuard)
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(req.sessionToken);
    res.clearCookie(this.sessions.cookieName(), this.sessions.clearCookieOptions());
    return { ok: true };
  }

  @Get('me/:orgSlug')
  @UseGuards(SessionGuard)
  async me(@Req() req: AuthenticatedRequest, @Param('orgSlug') orgSlug: string) {
    return this.auth.buildSessionView(req.userId!, orgSlug);
  }

  @Post('token')
  async issueToken(
    @Body() body: TokenRequestDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionToken = req.cookies?.[this.sessions.cookieName()] as
      | string
      | undefined;

    if (sessionToken) {
      const jwt = await this.auth.issueJwtFromSession(sessionToken, body.orgSlug);
      return jwt;
    }

    if (body.email && body.password) {
      const result = await this.auth.issueJwtFromLocalLogin(
        body.orgSlug,
        body.email,
        body.password,
      );
      this.setSessionCookie(res, result.sessionToken);
      return { accessToken: result.accessToken, expiresIn: result.expiresIn };
    }

    throw new UnauthorizedException('Provide session cookie or email/password');
  }

  private setSessionCookie(res: Response, token: string): void {
    res.cookie(this.sessions.cookieName(), token, this.sessions.cookieOptions());
  }
}
