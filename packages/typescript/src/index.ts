export type HealthStatus = 'ok' | 'degraded';

export interface HealthResponse {
  status: HealthStatus;
  service: string;
  timestamp: string;
}

export interface DatabaseHealthResponse extends HealthResponse {
  database: 'connected' | 'disconnected' | 'skipped';
}
