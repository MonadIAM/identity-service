import { Provider } from "@nestjs/common";

import { SignupHandler } from "./signup.handler";
import { OAuthHandler } from "./oauth.handler";

export const SIGNUP_HANDLER = Symbol("Handlers.Signup.Contract");
export const OAUTH_HANDLER = Symbol("Handlers.OAuth.Contract");

export const HANDLERS: Provider[] = [
    {
        provide: SIGNUP_HANDLER,
        useClass: SignupHandler,
    },
    {
        provide: OAUTH_HANDLER,
        useClass: OAuthHandler,
    },
];
