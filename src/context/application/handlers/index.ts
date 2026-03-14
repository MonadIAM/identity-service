import { Provider } from "@nestjs/common";

import { VerificationHandler } from "./verification.handler";
import { SignupHandler } from "./signup.handler";
import { OAuthHandler } from "./oauth.handler";

export const VERIFICATION_HANDLER = Symbol("Handlers.Verification.Contract");
export const SIGNUP_HANDLER = Symbol("Handlers.Signup.Contract");
export const OAUTH_HANDLER = Symbol("Handlers.OAuth.Contract");

export const HANDLERS: Provider[] = [
    {
        provide: VERIFICATION_HANDLER,
        useClass: VerificationHandler,
    },
    {
        provide: SIGNUP_HANDLER,
        useClass: SignupHandler,
    },
    {
        provide: OAUTH_HANDLER,
        useClass: OAuthHandler,
    },
];
