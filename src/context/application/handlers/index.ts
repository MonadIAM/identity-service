import { Provider } from "@nestjs/common";

import { VerificationHandler } from "./verification.handler";
import { SessionHandler } from "./session.handler";
import { SignupHandler } from "./signup.handler";
import { OAuthHandler } from "./oauth.handler";
import { LoginHandler } from "./login.handler";

export const VERIFICATION_HANDLER = Symbol("Handlers.Verification.Contract");
export const SESSION_HANDLER = Symbol("Handlers.Session.Contract");
export const SIGNUP_HANDLER = Symbol("Handlers.Signup.Contract");
export const OAUTH_HANDLER = Symbol("Handlers.OAuth.Contract");
export const LOGIN_HANDLER = Symbol("Handlers.Login.Contract");

export const HANDLERS: Provider[] = [
    {
        provide: VERIFICATION_HANDLER,
        useClass: VerificationHandler,
    },
    {
        provide: SESSION_HANDLER,
        useClass: SessionHandler,
    },
    {
        provide: SIGNUP_HANDLER,
        useClass: SignupHandler,
    },
    {
        provide: OAUTH_HANDLER,
        useClass: OAuthHandler,
    },
    {
        provide: LOGIN_HANDLER,
        useClass: LoginHandler,
    },
];
