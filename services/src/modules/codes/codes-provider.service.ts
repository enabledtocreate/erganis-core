import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DEFAULT_CODE_RULES, CodeRuleInput } from './default-rule-packs';
import { CodeRuleRepository } from './codes.repository';

@Injectable()
export class CodesProviderService implements OnApplicationBootstrap {
  constructor(
    private readonly rules: CodeRuleRepository,
    private readonly database: DatabaseService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.database.isConfigured()) {
      return;
    }
    await this.ensureSeedData();
  }

  async queryRules(filters: {
    jurisdiction?: string;
    edition?: string;
    topic?: string;
    ruleFamily?: string;
  }) {
    return this.rules.listRules(filters);
  }

  async importRules(source: string, rules: CodeRuleInput[]): Promise<number> {
    for (const rule of rules) {
      await this.rules.upsertRule(rule);
    }
    const edition = rules[0]?.edition;
    await this.rules.appendSyncLog(source, edition, rules.length);
    return rules.length;
  }

  async ensureSeedData(): Promise<void> {
    const count = await this.rules.countAll();
    if (count > 0) {
      return;
    }
    await this.importRules('platform.seed', DEFAULT_CODE_RULES);
  }
}
