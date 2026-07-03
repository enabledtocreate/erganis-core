import { Injectable } from '@nestjs/common';
import { PgRepository } from '@erganis/dal-postgres';
import { Pool } from 'pg';
import { CodeRuleInput, CodeRuleRecord } from './default-rule-packs';

@Injectable()
export class CodeRuleRepository extends PgRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async countAll(): Promise<number> {
    const result = await this.query(`SELECT COUNT(*)::int AS count FROM platform.code_rule_packs`, []);
    return Number(result.rows[0]?.count ?? 0);
  }

  async upsertRule(rule: CodeRuleInput): Promise<void> {
    await this.execute(
      `INSERT INTO platform.code_rule_packs
         (rule_family, jurisdiction, edition, topic, rule_key, title, body,
          numeric_value, unit, metadata, effective_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::date)
       ON CONFLICT (rule_family, jurisdiction, edition, rule_key)
       DO UPDATE SET
         topic = EXCLUDED.topic,
         title = EXCLUDED.title,
         body = EXCLUDED.body,
         numeric_value = EXCLUDED.numeric_value,
         unit = EXCLUDED.unit,
         metadata = EXCLUDED.metadata,
         effective_date = EXCLUDED.effective_date`,
      [
        rule.ruleFamily,
        rule.jurisdiction,
        rule.edition,
        rule.topic,
        rule.ruleKey,
        rule.title,
        rule.body ?? null,
        rule.numericValue ?? null,
        rule.unit ?? null,
        JSON.stringify(rule.metadata ?? {}),
        rule.effectiveDate ?? null,
      ],
    );
  }

  async listRules(filters: {
    jurisdiction?: string;
    edition?: string;
    topic?: string;
    ruleFamily?: string;
  }): Promise<CodeRuleRecord[]> {
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (filters.jurisdiction) {
      params.push(filters.jurisdiction);
      clauses.push(`jurisdiction = $${params.length}`);
    }
    if (filters.edition) {
      params.push(filters.edition);
      clauses.push(`edition = $${params.length}`);
    }
    if (filters.topic) {
      params.push(filters.topic);
      clauses.push(`topic = $${params.length}`);
    }
    if (filters.ruleFamily) {
      params.push(filters.ruleFamily);
      clauses.push(`rule_family = $${params.length}`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return this.queryMany(
      `SELECT id, rule_family, jurisdiction, edition, topic, rule_key, title, body,
              numeric_value, unit, metadata, effective_date
       FROM platform.code_rule_packs
       ${where}
       ORDER BY rule_family, topic, rule_key`,
      params,
      (row) => ({
        id: String(row.id),
        ruleFamily: row.rule_family as CodeRuleRecord['ruleFamily'],
        jurisdiction: String(row.jurisdiction),
        edition: String(row.edition),
        topic: String(row.topic),
        ruleKey: String(row.rule_key),
        title: String(row.title),
        body: row.body == null ? undefined : String(row.body),
        numericValue: row.numeric_value == null ? undefined : Number(row.numeric_value),
        unit: row.unit == null ? undefined : String(row.unit),
        metadata: (row.metadata ?? {}) as Record<string, unknown>,
        effectiveDate: row.effective_date == null ? undefined : String(row.effective_date),
      }),
    );
  }

  async appendSyncLog(source: string, edition: string | undefined, rulesImported: number): Promise<void> {
    await this.execute(
      `INSERT INTO platform.code_sync_log (source, edition, rules_imported) VALUES ($1, $2, $3)`,
      [source, edition ?? null, rulesImported],
    );
  }
}
