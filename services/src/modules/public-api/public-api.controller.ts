import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, JwtAuthenticatedRequest } from '../auth/guards/jwt-auth.guard';

@Controller('public/v1')
export class PublicApiController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: JwtAuthenticatedRequest) {
    return {
      userPublicId: req.userPublicId,
      userId: req.userId,
    };
  }
}
