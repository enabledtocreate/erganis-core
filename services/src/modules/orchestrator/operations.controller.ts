import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { OperationEnvelope } from '@erganis/platform';
import { AuthenticatedRequest, SessionGuard } from '../auth/guards/session.guard';
import { UserRepository } from '../auth/infrastructure/user.repository';
import { OrchestratorService } from './orchestrator.service';
import { ModuleLoaderService } from '../loader/module-loader.service';

@Controller('operations')
export class OperationsController {
  constructor(
    private readonly orchestrator: OrchestratorService,
    private readonly loader: ModuleLoaderService,
    private readonly users: UserRepository,
  ) {}

  @Get('modules')
  listModules() {
    return this.loader.getEnabledModules().map((m) => ({
      id: m.manifest.id,
      name: m.manifest.name,
      version: m.manifest.version,
      operations: m.operations,
    }));
  }

  @Post('execute')
  @UseGuards(SessionGuard)
  async execute(
    @Req() req: AuthenticatedRequest,
    @Body() envelope: OperationEnvelope,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.users.findById(req.userId!);
    const result = await this.orchestrator.execute({
      envelope,
      userId: req.userId!,
      userPublicId: user?.publicId ?? '',
    });
    res.status(result.outcome === 'partial' ? 200 : 201);
    return result;
  }
}
