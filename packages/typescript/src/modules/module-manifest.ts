import { OperationAction, StepFailureClass, StepPhase } from '../orchestration/operation-envelope';

export interface ModuleManifestOperation {
  surfaceId: string;
  action: OperationAction;
  stepId: string;
  handler: string;
  failureClass: StepFailureClass;
  phase?: StepPhase;
  compensate?: string;
}

export interface ModuleManifestMigration {
  version: string;
  path: string;
}

export interface ModuleManifestJob {
  jobId: string;
  handler: string;
  schedule?: string;
}

export interface ModuleManifestEvent {
  eventType: string;
  handler: string;
}

export interface ModuleManifestUi {
  slot: string;
  component: string;
}

export interface ModuleManifestLayout {
  surfaceId: string;
  path: string;
}

export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  erganisCoreVersion: string;
  description?: string;
  entryPoint: string;
  contributions?: {
    operations?: ModuleManifestOperation[];
    jobs?: ModuleManifestJob[];
    events?: ModuleManifestEvent[];
    ui?: ModuleManifestUi[];
    layout?: ModuleManifestLayout[];
  };
  migrations?: ModuleManifestMigration[];
}

export interface DiscoveredModule {
  manifest: ModuleManifest;
  rootDir: string;
  manifestPath: string;
}
