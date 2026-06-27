import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrchestratorModule } from './modules/orchestrator/orchestrator.module';
import { FileModule } from './modules/file/file.module';
import { SurfaceModule } from './modules/surface/surface.module';
import { PublicApiModule } from './modules/public-api/public-api.module';
import { PlatformServicesModule } from './modules/platform-services/platform-services.module';

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
  ],
})
export class AppModule {}
