import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { FastifyRequest } from "fastify";

export const ExtractPendingToken = createParamDecorator((_data: unknown, context: ExecutionContext): Optional<string> => {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    return request.cookies["pending_token"];
});
