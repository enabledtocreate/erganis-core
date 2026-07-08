import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { AgentCapabilitiesService } from './agent-capabilities.service';

@Controller('agent')
export class AgentController {
  constructor(private readonly capabilities: AgentCapabilitiesService) {}

  @Get('capabilities')
  @UseGuards(SessionGuard)
  async getCapabilities(@Query('orgSlug') orgSlug: string) {
    return this.capabilities.buildCapabilities(orgSlug ?? '');
  }
}
