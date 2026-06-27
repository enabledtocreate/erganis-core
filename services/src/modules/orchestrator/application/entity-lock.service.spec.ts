import { ConflictException } from '@nestjs/common';
import { EntityLockService } from './entity-lock.service';

describe('EntityLockService', () => {
  const locks = {
    getVersion: jest.fn(),
    tryAcquireLock: jest.fn(),
    incrementVersion: jest.fn(),
    releaseLock: jest.fn(),
  };

  const config = {
    get: jest.fn().mockReturnValue(300),
  };

  let service: EntityLockService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EntityLockService(locks as never, config as never);
  });

  it('throws VERSION_CONFLICT when expected version mismatches', async () => {
    locks.getVersion.mockResolvedValue(3);
    await expect(
      service.assertVersion('org-1', 'prod_abc', 2),
    ).rejects.toThrow(ConflictException);
  });

  it('throws LOCK_CONFLICT when lock not acquired', async () => {
    locks.tryAcquireLock.mockResolvedValue(false);
    await expect(
      service.acquireLock('org-1', 'prod_abc', 'op_1', 'user-1'),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'LOCK_CONFLICT' }),
    });
  });

  it('skips lock when entityPublicId absent', async () => {
    await service.acquireLock('org-1', undefined, 'op_1', 'user-1');
    expect(locks.tryAcquireLock).not.toHaveBeenCalled();
  });
});
