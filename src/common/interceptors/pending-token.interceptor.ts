import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { isString } from "class-validator";
import { Reflector } from "@nestjs/core";
import { FastifyReply } from "fastify";
import ms, { StringValue } from "ms";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";

import { SKIP_INTERCEPTORS } from "~common/decorators";

@Injectable()
export class PendingTokenInterceptor implements NestInterceptor {
    private readonly pending2FAMaxAge: number;

    public constructor(
        private readonly configService: ConfigService,
        private readonly reflector: Reflector,
    ) {
        this.pending2FAMaxAge = ms(this.configService.getOrThrow<StringValue>("PENDING_TOKEN_EXPIRY_MINUTES")) / 1e3;
    }

    public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const skip = this.reflector.getAllAndOverride<boolean>(SKIP_INTERCEPTORS, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (skip) {
            return next.handle();
        }

        const reply = context.switchToHttp().getResponse<FastifyReply>();

        return next.handle().pipe(
            map((data) => {
                if (isString(data?.pendingToken)) {
                    const { pendingToken, ...rest } = data;

                    reply.setCookie("pending_token", pendingToken, {
                        maxAge: this.pending2FAMaxAge,
                        path: "/authn/verify/second-factor",
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
