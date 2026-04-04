import { Provider } from "@nestjs/common";

import { OAuthHandler } from "./oauth.handler";
import { AuthHandler } from "./auth.handler";

export const OAUTH_HANDLER = Symbol("Handlers.OAuth.Contract");
export const AUTH_HANDLER = Symbol("Handlers.Auth.Contract");

export const HANDLERS: Provider[] = [
    {
        provide: OAUTH_HANDLER,
        useClass: OAuthHandler,
    },
    {
        provide: AUTH_HANDLER,
        useClass: AuthHandler,
    },
];
