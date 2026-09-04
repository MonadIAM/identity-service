import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export class Tokens {
    public static readonly Pending = createParamDecorator((_: unknown, ctx: ExecutionContext): Optional<string> => {
        return ctx.switchToHttp().getRequest<Req>().cookies["pending_token"];
    });
}
