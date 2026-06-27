/** Background job handler — async work outside the operation envelope transaction. */
export type JobHandler = (payload: Record<string, unknown>) => Promise<void>;

export type JobHandlerRegistry = Map<string, JobHandler>;

/** Build registry key: `{moduleId}:{handlerName}` */
export function jobHandlerKey(moduleId: string, handlerName: string): string {
  return `${moduleId}:${handlerName}`;
}
