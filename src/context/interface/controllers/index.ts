import { ElevatedAccessController } from "./elevated-access.controller";
import { SecondFactorController } from "./second-factor.controller";
import { IdentifierController } from "./identifier.controller";
import { PasswordController } from "./password.controller";
import { ProfileController } from "./profile.controller";
import { SessionController } from "./session.controller";
import { AccountController } from "./account.controller";
import { OAuthController } from "./oauth.controller";
import { AuthController } from "./auth.controller";

export const CONTROLLERS = [
    ElevatedAccessController,
    SecondFactorController,
    IdentifierController,
    PasswordController,
    ProfileController,
    SessionController,
    AccountController,
    OAuthController,
    AuthController,
];

export {
    ElevatedAccessController,
    SecondFactorController,
    IdentifierController,
    PasswordController,
    ProfileController,
    SessionController,
    AccountController,
    OAuthController,
    AuthController,
};
