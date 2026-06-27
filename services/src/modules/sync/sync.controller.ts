import {
  Body,
  ConflictException,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/guards/session.guard';

interface SyncRecord {
  entityPublicId: string;
  entityVersion: number;
  payload: Record<string, unknown>;
}

const syncStore = new Map<string, SyncRecord>();

@Controller('sync')
@UseGuards(SessionGuard)
export class SyncController {
  @Get('pull')
  pull(@Query('orgSlug') orgSlug: string, @Query('sinceVersion') sinceVersion?: string) {
    const minVersion = sinceVersion ? parseInt(sinceVersion, 10) : 0;
    const records = [...syncStore.values()].filter((r) => r.entityVersion > minVersion);
    return { orgSlug, records };
  }

  @Post('push')
  push(
    @Body()
    body: {
      orgSlug: string;
      changes: Array<{ entityPublicId: string; entityVersion: number; payload: Record<string, unknown> }>;
    },
  ) {
    const conflicts: string[] = [];
    for (const change of body.changes ?? []) {
      const existing = syncStore.get(change.entityPublicId);
      if (existing && existing.entityVersion !== change.entityVersion) {
        conflicts.push(change.entityPublicId);
        continue;
      }
      syncStore.set(change.entityPublicId, {
        entityPublicId: change.entityPublicId,
        entityVersion: change.entityVersion + 1,
        payload: change.payload,
      });
    }
    if (conflicts.length > 0) {
      throw new ConflictException({
        code: 'SYNC_CONFLICT',
        entityPublicIds: conflicts,
      });
    }
    return { ok: true, orgSlug: body.orgSlug };
  }
}
