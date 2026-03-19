import { SecondFactorController } from "./second-factor.controller";
import { IdentifierController } from "./identifier.controller";
import { PasswordController } from "./password.controller";
import { AccountController } from "./account.controller";
import { SignupController } from "./signup.controller";

export const CONTROLLERS = [
    SecondFactorController,
    IdentifierController,
    PasswordController,
    AccountController,
    SignupController,
];

export { SecondFactorController, IdentifierController, PasswordController, AccountController, SignupController };
