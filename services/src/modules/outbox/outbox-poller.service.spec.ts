import { OutboxPollerService } from './outbox-poller.service';

describe('OutboxPollerService', () => {
  const config = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      if (key === 'outboxBatchSize') return 10;
      return defaultValue;
    }),
  };
  const database = { isConfigured: () => true };
  const outbox = {
    fetchPending: jest.fn().mockResolvedValue([
      { id: 'evt-1', eventType: 'operation.completed', payload: { operationId: 'op_1' } },
    ]),
    markPublished: jest.fn(),
  };
  const dispatcher = { dispatch: jest.fn() };

  const poller = new OutboxPollerService(
    config as never,
    database as never,
    outbox as never,
    dispatcher as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches pending outbox events and marks them published', async () => {
    const count = await poller.pollOnce();
    expect(count).toBe(1);
    expect(dispatcher.dispatch).toHaveBeenCalledWith('operation.completed', {
      operationId: 'op_1',
    });
    expect(outbox.markPublished).toHaveBeenCalledWith(['evt-1']);
  });
});
