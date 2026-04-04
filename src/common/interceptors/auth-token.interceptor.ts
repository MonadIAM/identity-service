import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FastifyReply } from "fastify";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";

@Injectable()
export class AuthTokenInterceptor implements NestInterceptor {
    private readonly refreshTokenMaxAge: number;

    public constructor(private readonly configService: ConfigService) {
        const expiryDays = this.configService.getOrThrow<number>("SESSION_EXPIRY_DAYS");
        this.refreshTokenMaxAge = expiryDays * 24 * 60 * 60;
    }

    public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const reply = context.switchToHttp().getResponse<FastifyReply>();

        return next.handle().pipe(
            map((data) => {
                if ("accessToken" in data && "refreshToken" in data) {
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
