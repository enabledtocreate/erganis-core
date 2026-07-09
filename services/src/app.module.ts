import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { HttpLoggingInterceptor } from './common/logging/http-logging.interceptor';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrchestratorModule } from './modules/orchestrator/orchestrator.module';
import { FileModule } from './modules/file/file.module';
import { SurfaceModule } from './modules/surface/surface.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { PlatformServicesModule } from './modules/platform-services/platform-services.module';
import { CompositionModule } from './modules/composition/composition.module';
import { SyncModule } from './modules/sync/sync.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { JobModule } from './modules/jobs/job.module';
import { SearchModule } from './modules/search/search.module';
import { AgentModule } from './modules/agent/agent.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    OrchestratorModule,
    FileModule,
    SurfaceModule,
    PublicApiModule,
    PlatformServicesModule,
    CompositionModule,
    SyncModule,
    JobModule,
    OutboxModule,
    SearchModule,
    AgentModule,
    WorkflowModule,
    AdminModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor }],
})
export class AppModule {}
