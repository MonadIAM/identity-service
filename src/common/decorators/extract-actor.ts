import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const ExtractActor = createParamDecorator((_data: unknown, context: ExecutionContext): ActorContext => {
    const { actorContext } = context.switchToHttp().getRequest<Req<{ Querystring: { realm?: string } }>>();
    return actorContext;
});
