import { ConflictException } from '@nestjs/common';
import { SyncController } from './sync.controller';

describe('SyncController', () => {
  const controller = new SyncController();

  it('pull returns records newer than sinceVersion', () => {
    controller.push({
      orgSlug: 'acme',
      changes: [{ entityPublicId: 'ent_1', entityVersion: 1, payload: { x: 1 } }],
    });
    const pulled = controller.pull('acme', '0');
    expect(pulled.records).toHaveLength(1);
    expect(pulled.records[0].entityVersion).toBe(2);
  });

  it('push reports version conflicts', () => {
    controller.push({
      orgSlug: 'acme',
      changes: [{ entityPublicId: 'ent_2', entityVersion: 5, payload: { y: 2 } }],
    });
    expect(() =>
      controller.push({
        orgSlug: 'acme',
        changes: [{ entityPublicId: 'ent_2', entityVersion: 4, payload: { y: 3 } }],
      }),
    ).toThrow(ConflictException);
  });
});
