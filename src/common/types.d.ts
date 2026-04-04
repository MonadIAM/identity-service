import type { FastifyRequest, RouteGenericInterface } from "fastify";

declare global {
    type Pagination = {
        currentPage: number;
        elementsPerPage: number;
    };

    type RequestContext = {
        userAgent: string;
        ip: string;
    };

    type MessageResult = {
        message: string;
        params?: Record<string, unknown>;
    };

    type Req<T extends RouteGenericInterface = RouteGenericInterface> = FastifyRequest<T> & {
        sessionContext: SessionContext;
    };

    type SessionContext = {
        refreshToken?: string;
        accessToken?: string;
        account: string;
        session: string;
    };

    namespace OAuth {
        type ResolveProvider = CommonServices.GoogleOAuth.Contract | CommonServices.GitHubOAuth.Contract;
    }
}
