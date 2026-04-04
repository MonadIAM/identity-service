import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { GuardException } from "~common/exceptions";
import { IS_PUBLIC_KEY } from "~common/decorators";
import { JWT_SERVICE } from "~common/services";

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly dictionaryPath = "guard.auth";

    public constructor(
        private readonly reflector: Reflector,
        @Inject(JWT_SERVICE)
        private readonly jwtService: CommonServices.JWT.Contract,
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const request = context.switchToHttp().getRequest<Req>();
        const token = this.extractToken(request);

        if (token) {
            try {
                const payload = await this.jwtService.verify(token);

                if (payload.sub && payload.jti) {
                    request.sessionContext = {
                        account: payload.sub,
                        session: payload.jti,
                    } satisfies SessionContext;

                    return true;
                }

                if (isPublic) {
                    return true;
                }

                throw GuardException.unauthorized(`${this.dictionaryPath}.INVALID_TOKEN`);
            } catch (error) {
                if (isPublic) {
                    return true;
                }

                if (error instanceof GuardException) {
                    throw error;
                }

                throw GuardException.unauthorized(`${this.dictionaryPath}.INVALID_TOKEN`);
            }
        }

        if (isPublic) {
            return true;
        }

        throw GuardException.unauthorized(`${this.dictionaryPath}.TOKEN_MISSING`);
    }

    private extractToken(request: Req): Nullable<string> {
        const header = request.headers.authorization;

        if (header) {
            const [scheme, token] = header.split(" ");
            return scheme === "Bearer" && token ? token : null;
        }

        return null;
    }
}
