import { Module } from '@nestjs/common';
import { createPoolRepository } from '@erganis/dal-postgres';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { OrgRepository } from '../auth/infrastructure/org.repository';
import { CompositionController } from './composition.controller';
import { OrgThemeRepository } from './theme.repository';
import { ThemeResolutionService } from './theme-resolution.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [CompositionController],
  providers: [
    ThemeResolutionService,
    {
      provide: OrgThemeRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(OrgThemeRepository, db.getPool()),
      inject: [DatabaseService],
    },
    {
      provide: OrgRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(OrgRepository, db.getPool()),
      inject: [DatabaseService],
    },
  ],
  exports: [ThemeResolutionService],
})
export class CompositionModule {}
