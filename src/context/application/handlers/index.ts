import { Provider } from "@nestjs/common";

import { SecondFactorHandler } from "./second-factor.handler";
import { VerificationHandler } from "./verification.handler";
import { NotificationHandler } from "./notification.handler";
import { IdentifierHandler } from "./identifier.handler";
import { PasswordHandler } from "./password.handler";
import { AccountHandler } from "./account.handler";
import { ProfileHandler } from "./profile.handler";
import { SessionHandler } from "./session.handler";
import { SignupHandler } from "./signup.handler";
import { OAuthHandler } from "./oauth.handler";
import { LoginHandler } from "./login.handler";

export const SECOND_FACTOR_HANDLER = Symbol("Handlers.SecondFactor.Contract");
export const VERIFICATION_HANDLER = Symbol("Handlers.Verification.Contract");
export const NOTIFICATION_HANDLER = Symbol("Handlers.Notification.Contract");
export const IDENTIFIER_HANDLER = Symbol("Handlers.Identifier.Contract");
export const PASSWORD_HANDLER = Symbol("Handlers.Password.Contract");
export const ACCOUNT_HANDLER = Symbol("Handlers.Account.Contract");
export const PROFILE_HANDLER = Symbol("Handlers.Profile.Contract");
export const SESSION_HANDLER = Symbol("Handlers.Session.Contract");
export const SIGNUP_HANDLER = Symbol("Handlers.Signup.Contract");
export const OAUTH_HANDLER = Symbol("Handlers.OAuth.Contract");
export const LOGIN_HANDLER = Symbol("Handlers.Login.Contract");

export const HANDLERS: Provider[] = [
    {
        provide: NOTIFICATION_HANDLER,
        useClass: NotificationHandler,
    },
    {
        provide: SECOND_FACTOR_HANDLER,
        useClass: SecondFactorHandler,
    },
    {
        provide: VERIFICATION_HANDLER,
        useClass: VerificationHandler,
    },
    {
        provide: IDENTIFIER_HANDLER,
        useClass: IdentifierHandler,
    },
    {
        provide: PASSWORD_HANDLER,
        useClass: PasswordHandler,
    },
    {
        provide: ACCOUNT_HANDLER,
        useClass: AccountHandler,
    },
    {
        provide: PROFILE_HANDLER,
        useClass: ProfileHandler,
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
