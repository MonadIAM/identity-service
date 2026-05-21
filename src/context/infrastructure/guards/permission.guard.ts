import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { ACCESS_CACHE_SERVICE } from "~context/infrastructure/services/tokens";
import { REQUIRE_PERMISSION, IS_PUBLIC } from "~common/decorators";
import { GuardException } from "~common/exceptions";

@Injectable()
export class PermissionGuard implements CanActivate {
    private readonly dictionaryPath = "guard.permission";

    public constructor(
        @Inject(ACCESS_CACHE_SERVICE)
        private readonly accessCacheService: InfrastructureServices.AccessCache.Contract,
        private readonly reflector: Reflector,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()]);

        if (isPublic) {
            return true;
        }

        const permissions = this.reflector.getAllAndOverride<string[]>(REQUIRE_PERMISSION, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!permissions?.length) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Req<{ Querystring: { realm?: string } }>>();
        const realm = request.query?.realm;
        const account = request.session?.account;

        if (!account) {
            throw GuardException.forbidden(`${this.dictionaryPath}.ACCOUNT_REQUIRED`);
        }

        if (!realm) {
            throw GuardException.forbidden(`${this.dictionaryPath}.REALM_REQUIRED`);
        }

        const allowed = await this.accessCacheService.exists({
            permissions,
            account,
            realm,
        });

        if (!allowed) {
            throw GuardException.forbidden(`${this.dictionaryPath}.INSUFFICIENT_PERMISSIONS`);
        }

        request.metadata = {
            ...request.metadata,
            permissions,
        };

        return true;
    }
}
