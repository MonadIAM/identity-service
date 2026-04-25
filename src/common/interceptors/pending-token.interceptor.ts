import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { isString } from "class-validator";
import { Reflector } from "@nestjs/core";
import { FastifyReply } from "fastify";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";

import { SKIP_INTERCEPTORS_KEY } from "~common/decorators";

@Injectable()
export class PendingTokenInterceptor implements NestInterceptor {
    private readonly pendingAuthMaxAge: number;

    public constructor(
        private readonly configService: ConfigService,
        private readonly reflector: Reflector,
    ) {
        const expiryMinutes = this.configService.getOrThrow<number>("PENDING_TOKEN_EXPIRY_MINUTES");
        this.pendingAuthMaxAge = expiryMinutes * 60;
    }

    public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const skip = this.reflector.getAllAndOverride<boolean>(SKIP_INTERCEPTORS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (skip) {
            return next.handle();
        }

        const reply = context.switchToHttp().getResponse<FastifyReply>();

        return next.handle().pipe(
            map((data) => {
                if (isString(data?.accessToken) && isString(data?.refreshToken)) {
                    const { pendingToken, ...rest } = data;

                    reply.setCookie("pending_token", pendingToken, {
                        maxAge: this.pendingAuthMaxAge,
                        path: "/auth/2fa/confirm",
                        sameSite: "strict",
                        httpOnly: true,
                        secure: true,
                    });

                    return rest;
                } else {
                    return data;
                }
            }),
        );
    }
}
