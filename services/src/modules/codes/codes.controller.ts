import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { CodesProviderService } from './codes-provider.service';

@Controller('codes')
@UseGuards(SessionGuard)
export class CodesController {
  constructor(private readonly codes: CodesProviderService) {}

  @Get('rules')
  async listRules(
    @Query('jurisdiction') jurisdiction?: string,
    @Query('edition') edition?: string,
    @Query('topic') topic?: string,
    @Query('ruleFamily') ruleFamily?: string,
  ) {
    const rules = await this.codes.queryRules({
      jurisdiction,
      edition,
      topic,
      ruleFamily,
    });
    return {
      jurisdiction: jurisdiction ?? 'US',
      edition: edition ?? null,
      topic: topic ?? null,
      ruleFamily: ruleFamily ?? null,
      rules,
    };
  }
}
