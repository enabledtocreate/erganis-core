import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { SurfaceLoadService } from './surface-load.service';

@Controller('surfaces')
export class SurfaceController {
  constructor(private readonly surfaces: SurfaceLoadService) {}

  @Get(':surfaceId/load')
  @UseGuards(SessionGuard)
  load(
    @Param('surfaceId') surfaceId: string,
    @Query() query: Record<string, string | undefined>,
  ) {
    const { orgSlug, ...rest } = query;
    const payload = Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined && value !== ''),
    );
    return this.surfaces.loadSurface(orgSlug ?? '', surfaceId, payload);
  }
}
