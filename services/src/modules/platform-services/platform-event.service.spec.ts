import { PlatformEventService } from './platform-event.service';

describe('PlatformEventService', () => {
  it('records operation log and outbox event', async () => {
    const operationLog = { append: jest.fn() };
    const outbox = { enqueue: jest.fn() };
    const jobs = { send: jest.fn() };
    const service = new PlatformEventService(
      operationLog as never,
      outbox as never,
      jobs as never,
    );
    await service.recordOperation({
      orgId: 'org-1',
      userId: 'user-1',
      result: {
        operationId: 'op_1',
        outcome: 'success',
        surfaceId: 'stub',
        action: 'save',
        steps: [],
        warnings: [],
      },
    });
    expect(operationLog.append).toHaveBeenCalled();
    expect(outbox.enqueue).toHaveBeenCalledWith(
      'operation.completed',
      expect.objectContaining({ operationId: 'op_1', orgId: 'org-1' }),
    );
  });

  it('enqueues pg-boss jobs', async () => {
    const jobs = { send: jest.fn() };
    const service = new PlatformEventService({} as never, {} as never, jobs as never);
    await service.enqueueJob('custom.job', { foo: 'bar' });
    expect(jobs.send).toHaveBeenCalledWith('custom.job', { foo: 'bar' });
  });
});
