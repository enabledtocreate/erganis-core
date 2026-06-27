import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';
import { OrgRepository } from '../auth/infrastructure/org.repository';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(SessionGuard)
export class SearchController {
  constructor(
    private readonly search: SearchService,
    private readonly orgs: OrgRepository,
  ) {}

  @Get()
  async query(
    @Query('orgSlug') orgSlug: string,
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      return { hits: [], orgSlug };
    }
    const hits = q?.trim()
      ? await this.search.search(org.id, q.trim(), limit ? parseInt(limit, 10) : 20)
      : [];
    return { orgSlug, query: q ?? '', hits };
  }
}
