import { PlatformEventHandlers } from './platform-event-handlers';

describe('PlatformEventHandlers', () => {
  it('enqueues search touch job on operation.completed', () => {
    const dispatcher = { register: jest.fn() };
    const jobs = { send: jest.fn() };
    const handlers = new PlatformEventHandlers(dispatcher as never, jobs as never);
    handlers.onApplicationBootstrap();
    const registered = dispatcher.register.mock.calls[0];
    expect(registered[0]).toBe('operation.completed');
    registered[1]({ operationId: 'op_1' });
    expect(jobs.send).toHaveBeenCalledWith('platform.search.touch', { operationId: 'op_1' });
  });
});
