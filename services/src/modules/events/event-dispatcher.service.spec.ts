import { EventDispatcherService } from './event-dispatcher.service';

describe('EventDispatcherService', () => {
  it('invokes all handlers registered for an event type', async () => {
    const dispatcher = new EventDispatcherService();
    const first = jest.fn();
    const second = jest.fn();
    dispatcher.register('operation.completed', first);
    dispatcher.register('operation.completed', second);
    await dispatcher.dispatch('operation.completed', { operationId: 'op_1' });
    expect(first).toHaveBeenCalledWith({ operationId: 'op_1' });
    expect(second).toHaveBeenCalledWith({ operationId: 'op_1' });
  });
});
