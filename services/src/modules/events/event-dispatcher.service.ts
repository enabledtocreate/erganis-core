import { Injectable } from '@nestjs/common';

@Injectable()
export class EventDispatcherService {
  private readonly handlers = new Map<string, Array<(payload: Record<string, unknown>) => Promise<void>>>();

  register(
    eventType: string,
    handler: (payload: Record<string, unknown>) => Promise<void>,
  ): void {
    const list = this.handlers.get(eventType) ?? [];
    list.push(handler);
    this.handlers.set(eventType, list);
  }

  async dispatch(eventType: string, payload: Record<string, unknown>): Promise<void> {
    const handlers = this.handlers.get(eventType) ?? [];
    for (const handler of handlers) {
      await handler(payload);
    }
  }
}
