import { Module } from '@nestjs/common';
import { createPoolRepository } from '@erganis/dal-postgres';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { LoaderModule } from '../loader/loader.module';
import { OrgRepository } from '../auth/infrastructure/org.repository';
import { MembershipRepository } from '../auth/infrastructure/membership.repository';
import { OrgModuleRepository } from '../loader/org-module.repository';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [AuthModule, DatabaseModule, LoaderModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminGuard,
    {
      provide: OrgRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(OrgRepository, db.getPool()),
      inject: [DatabaseService],
    },
    {
      provide: MembershipRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(MembershipRepository, db.getPool()),
      inject: [DatabaseService],
    },
    {
      provide: OrgModuleRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(OrgModuleRepository, db.getPool()),
      inject: [DatabaseService],
    },
  ],
  exports: [AdminService],
})
export class AdminModule {}
