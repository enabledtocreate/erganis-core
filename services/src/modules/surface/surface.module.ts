import { Module } from '@nestjs/common';
import { createPoolRepository } from '@erganis/dal-postgres';
import { AuthModule } from '../auth/auth.module';
import { LoaderModule } from '../loader/loader.module';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { OrgRepository } from '../auth/infrastructure/org.repository';
import { SurfaceLoadService } from './surface-load.service';
import { SurfaceController } from './surface.controller';

@Module({
  imports: [AuthModule, LoaderModule, DatabaseModule],
  controllers: [SurfaceController],
  providers: [
    SurfaceLoadService,
    {
      provide: OrgRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(OrgRepository, db.getPool()),
      inject: [DatabaseService],
    },
  ],
})
export class SurfaceModule {}
