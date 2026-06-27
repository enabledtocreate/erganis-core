/** React to platform outbox events (async, after commit). */
export type EventHandler = (payload: Record<string, unknown>) => Promise<void>;

export type EventHandlerRegistry = Map<string, EventHandler[]>;
