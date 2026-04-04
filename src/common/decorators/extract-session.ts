import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const ExtractSession = createParamDecorator((_data: unknown, context: ExecutionContext): SessionContext => {
    const { sessionContext, headers, cookies } = context.switchToHttp().getRequest<Req>();

    return { ...sessionContext, accessToken: headers.authorization, refreshToken: cookies.refresh_token };
});
