import { Module } from '@nestjs/common';
import { createPoolRepository } from '@erganis/dal-postgres';
import { AuthModule } from '../auth/auth.module';
import { DatabaseService } from '../database/database.service';
import { OrgRepository } from '../auth/infrastructure/org.repository';
import { LocalFileStoreService } from './local-file-store.service';
import { FilesController } from './files.controller';

@Module({
  imports: [AuthModule],
  controllers: [FilesController],
  providers: [
    LocalFileStoreService,
    {
      provide: OrgRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(OrgRepository, db.getPool()),
      inject: [DatabaseService],
    },
  ],
  exports: [LocalFileStoreService],
})
export class FileModule {}
