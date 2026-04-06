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
        sessionContext: SessionContext.Public | SessionContext.Auth;
    };

    namespace SessionContext {
        type Auth = {
            tokens?: {
                refresh?: string;
                access?: string;
            };
            account: string;
            session: string;
        };
        type Public = {
            tokens?: {
                refresh?: string;
                access?: string;
            };
            account?: string;
            session?: string;
        };
    }

    namespace OAuth {
        type ResolveProvider = CommonServices.GoogleOAuth.Contract | CommonServices.GitHubOAuth.Contract;
    }
}
