import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { WorkflowService } from './workflow.service';

@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflows: WorkflowService) {}

  @Get('definitions')
  @UseGuards(SessionGuard)
  listDefinitions(@Query('orgSlug') orgSlug: string) {
    return this.workflows.listDefinitions(orgSlug ?? '');
  }

  @Get('definitions/:workflowKey')
  @UseGuards(SessionGuard)
  getDefinition(
    @Param('workflowKey') workflowKey: string,
    @Query('orgSlug') orgSlug: string,
    @Query('version') version?: string,
  ) {
    return this.workflows.getDefinition(orgSlug ?? '', workflowKey, version);
  }

  @Post('instances')
  @UseGuards(SessionGuard)
  startInstance(
    @Body()
    body: {
      orgSlug: string;
      workflowKey: string;
      version?: string;
      entityPublicId?: string;
      context?: Record<string, unknown>;
    },
  ) {
    return this.workflows.startInstance(body);
  }

  @Get('instances/:id')
  @UseGuards(SessionGuard)
  getInstance(@Param('id') id: string) {
    return this.workflows.getInstance(id);
  }

  @Post('instances/:id/advance')
  @UseGuards(SessionGuard)
  advanceInstance(@Param('id') id: string) {
    return this.workflows.advanceInstance(id);
  }
}
