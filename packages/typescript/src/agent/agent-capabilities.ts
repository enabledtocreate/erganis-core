/** Machine-readable platform capability index for agents and tool clients (Core C13). */

export interface AgentOperationCapability {
  moduleId: string;
  surfaceId: string;
  action: string;
  stepId: string;
  handler: string;
  failureClass: string;
  phase?: string;
}

export interface AgentSurfaceCapability {
  surfaceId: string;
  actions: string[];
  operations: AgentOperationCapability[];
  layoutPaths?: string[];
  uiSlots?: { slot: string; component: string }[];
}

export interface AgentSchemaRef {
  id: string;
  path: string;
  description: string;
}

export interface AgentCapabilitiesResponse {
  orgSlug: string;
  generatedAt: string;
  surfaces: AgentSurfaceCapability[];
  schemas: AgentSchemaRef[];
  endpoints: {
    execute: string;
    surfaceLoad: string;
    capabilities: string;
  };
}

export interface StructuredPlatformError {
  code: string;
  message: string;
  field?: string;
  recoverable: boolean;
  details?: Record<string, unknown>;
}
