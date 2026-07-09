import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OrgRepository } from '../../auth/infrastructure/org.repository';
import { MembershipRepository } from '../../auth/infrastructure/membership.repository';
import { AuthenticatedRequest } from '../../auth/guards/session.guard';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly orgs: OrgRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const orgSlug = req.params?.orgSlug as string | undefined;
    if (!req.userId) {
      throw new UnauthorizedException('Authentication required');
    }
    if (!orgSlug) {
      throw new ForbiddenException('Organization context required');
    }

    const org = await this.orgs.findBySlug(orgSlug);
    if (!org) {
      throw new ForbiddenException('Organization not found');
    }

    const membership = await this.memberships.findMembership(org.id, req.userId);
    if (!membership) {
      throw new ForbiddenException('User is not a member of this organization');
    }
    if (!membership.role.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
