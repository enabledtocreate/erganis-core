import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPoolRepository } from '@erganis/dal-postgres';
import { DatabaseService } from '../database/database.service';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './application/auth.service';
import { DomainJitService } from './application/domain-jit.service';
import { PasswordService } from './application/password.service';
import { SessionService } from './application/session.service';
import { TokenService } from './application/token.service';
import { OrgRepository } from './infrastructure/org.repository';
import { UserRepository } from './infrastructure/user.repository';
import { MembershipRepository } from './infrastructure/membership.repository';
import { SessionRepository } from './infrastructure/session.repository';
import { IdentityRepository } from './infrastructure/identity.repository';
import {
  HttpOidcAuthProvider,
  MockOidcAuthProvider,
  OIDC_AUTH_PROVIDER,
} from './infrastructure/oidc-auth.provider';
import { SessionGuard } from './guards/session.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    DomainJitService,
    PasswordService,
    SessionService,
    TokenService,
    SessionGuard,
    {
      provide: OrgRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(OrgRepository, db.getPool()),
      inject: [DatabaseService],
    },
    {
      provide: UserRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(UserRepository, db.getPool()),
      inject: [DatabaseService],
    },
    {
      provide: MembershipRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(MembershipRepository, db.getPool()),
      inject: [DatabaseService],
    },
    {
      provide: SessionRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(SessionRepository, db.getPool()),
      inject: [DatabaseService],
    },
    {
      provide: IdentityRepository,
      useFactory: (db: DatabaseService) =>
        createPoolRepository(IdentityRepository, db.getPool()),
      inject: [DatabaseService],
    },
    MockOidcAuthProvider,
    HttpOidcAuthProvider,
    {
      provide: OIDC_AUTH_PROVIDER,
      useFactory: (
        config: ConfigService,
        mock: MockOidcAuthProvider,
        http: HttpOidcAuthProvider,
      ) => (config.get<boolean>('authOidcMock') ? mock : http),
      inject: [ConfigService, MockOidcAuthProvider, HttpOidcAuthProvider],
    },
  ],
  exports: [AuthService, SessionService, SessionGuard],
})
export class AuthModule {}
