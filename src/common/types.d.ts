import type { FastifyRequest, RouteGenericInterface } from "fastify";

declare global {
    type Pagination = {
        currentPage: number;
        elementsPerPage: number;
    };

    type MessageResult = {
        params?: Record<string, unknown>;
        message: Intl.Key;
    };

    type Req<T extends RouteGenericInterface = RouteGenericInterface> = FastifyRequest<T> & {
        session: Extract.Session.Public | Extract.Session.Auth;
        metadata: {
            permissions?: string[];
        };
    };

    namespace FederatedAuthn {
        type ResolveProvider = CommonServices.GoogleOAuth.Contract | CommonServices.GitHubOAuth.Contract;
    }
}
