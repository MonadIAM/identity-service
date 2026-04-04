import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FastifyReply } from "fastify";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";

@Injectable()
export class PendingTokenInterceptor implements NestInterceptor {
    private readonly pendingAuthMaxAge: number;

    public constructor(private readonly configService: ConfigService) {
        const expiryMinutes = this.configService.getOrThrow<number>("PENDING_TOKEN_EXPIRY_MINUTES");
        this.pendingAuthMaxAge = expiryMinutes * 60;
    }

    public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const reply = context.switchToHttp().getResponse<FastifyReply>();

        return next.handle().pipe(
            map((data) => {
                if ("pendingToken" in data && "requires2FA" in data) {
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
