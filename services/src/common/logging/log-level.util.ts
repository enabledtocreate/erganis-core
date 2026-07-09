import { LogLevel } from '@nestjs/common';

export function resolveNestLogLevels(level: string | undefined): LogLevel[] {
  switch ((level ?? 'info').toLowerCase()) {
    case 'error':
      return ['error', 'fatal'];
    case 'warn':
      return ['error', 'warn', 'fatal'];
    case 'debug':
      return ['error', 'warn', 'log', 'debug', 'verbose', 'fatal'];
    case 'info':
    default:
      return ['error', 'warn', 'log', 'fatal'];
  }
}
