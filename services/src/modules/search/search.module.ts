import { Module } from '@nestjs/common';
import { createPoolRepository } from '@erganis/dal-postgres';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { OrgRepository } from '../auth/infrastructure/org.repository';
import { SearchController } from './search.controller';
import { SearchIndexRepository } from './search.repository';
import { SearchService } from './search.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [SearchController],
  providers: [
    SearchService,
    {
      provide: SearchIndexRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(SearchIndexRepository, db.getPool()),
      inject: [DatabaseService],
    },
    {
      provide: OrgRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(OrgRepository, db.getPool()),
      inject: [DatabaseService],
    },
  ],
  exports: [SearchService],
})
export class SearchModule {}
