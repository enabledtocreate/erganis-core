import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityLockRepository } from '../infrastructure/entity-lock.repository';

@Injectable()
export class EntityLockService {
  constructor(
    private readonly locks: EntityLockRepository,
    private readonly config: ConfigService,
  ) {}

  async assertVersion(
    orgId: string,
    entityPublicId: string | undefined,
    expectedVersion: number | undefined,
  ): Promise<void> {
    if (!entityPublicId || expectedVersion === undefined) {
      return;
    }
    const current = await this.locks.getVersion(orgId, entityPublicId);
    if (current !== null && current !== expectedVersion) {
      throw new ConflictException({
        code: 'VERSION_CONFLICT',
        message: 'Entity version conflict',
        expectedVersion,
        currentVersion: current,
      });
    }
  }

  async acquireLock(
    orgId: string,
    entityPublicId: string | undefined,
    operationId: string,
    userId: string,
  ): Promise<void> {
    if (!entityPublicId) {
      return;
    }
    const ttl = this.config.get<number>('entityLockTtlSeconds', 300);
    const acquired = await this.locks.tryAcquireLock({
      orgId,
      entityPublicId,
      operationId,
      userId,
      ttlSeconds: ttl,
    });
    if (!acquired) {
      throw new ConflictException({
        code: 'LOCK_CONFLICT',
        message: 'Entity is locked by another operation',
        entityPublicId,
      });
    }
  }

  async bumpVersion(orgId: string, entityPublicId: string | undefined): Promise<number | null> {
    if (!entityPublicId) {
      return null;
    }
    return this.locks.incrementVersion(orgId, entityPublicId);
  }

  async releaseLock(
    orgId: string,
    entityPublicId: string | undefined,
    operationId: string,
  ): Promise<void> {
    if (!entityPublicId) {
      return;
    }
    await this.locks.releaseLock(orgId, entityPublicId, operationId);
  }
}
