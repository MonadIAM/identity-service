import { Provider } from "@nestjs/common";

import { ElevatedAccessHandler } from "./elevated-access.handler";
import { OAuthHandler } from "./oauth.handler";
import { AuthHandler } from "./auth.handler";

export const ELEVATED_ACCESS_HANDLER = Symbol("Handlers.OAuth.Contract");
export const OAUTH_HANDLER = Symbol("Handlers.OAuth.Contract");
export const AUTH_HANDLER = Symbol("Handlers.Auth.Contract");

export const HANDLERS: Provider[] = [
    {
        provide: ELEVATED_ACCESS_HANDLER,
        useClass: ElevatedAccessHandler,
    },
    {
        provide: OAUTH_HANDLER,
        useClass: OAuthHandler,
    },
    {
        provide: AUTH_HANDLER,
        useClass: AuthHandler,
    },
];
