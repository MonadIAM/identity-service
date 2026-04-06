import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const ExtractSession = createParamDecorator(
    (_data: unknown, context: ExecutionContext): SessionContext.Public | SessionContext.Auth => {
        const { sessionContext, headers, cookies } = context.switchToHttp().getRequest<Req>();

        return { ...sessionContext, tokens: { access: headers.authorization, refresh: cookies.refresh_token } };
    },
);
