import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { isString } from "class-validator";
import { Reflector } from "@nestjs/core";
import { FastifyReply } from "fastify";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";

import { SKIP_INTERCEPTORS } from "~common/decorators";

@Injectable()
export class AuthTokenInterceptor implements NestInterceptor {
    private readonly refreshTokenMaxAge: number;

    public constructor(
        private readonly configService: ConfigService,
        private readonly reflector: Reflector,
    ) {
        const expiryDays = this.configService.getOrThrow<number>("SESSION_EXPIRY_DAYS");
        this.refreshTokenMaxAge = expiryDays * 24 * 60 * 60;
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
                if (isString(data?.accessToken) && isString(data?.refreshToken)) {
                    const { accessToken, refreshToken, ...rest } = data;

                    reply.header("Authorization", `Bearer ${accessToken}`);

                    reply.setCookie("refresh_token", refreshToken, {
                        maxAge: this.refreshTokenMaxAge,
                        path: "/auth/refresh",
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
