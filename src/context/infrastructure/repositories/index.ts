import { Provider } from "@nestjs/common";

import { NotificationRepository } from "./notification.repository";
import { IdentifierRepository } from "./identifier.repository";
import { ProfileRepository } from "./profile.repository";
import { AccountRepository } from "./account.repository";

export const NOTIFICATION_REPOSITORY = Symbol("Repositories.Notification.Contract");
export const IDENTIFIER_REPOSITORY = Symbol("Repositories.Identifier.Contract");
export const PROFILE_REPOSITORY = Symbol("Repositories.Profile.Contract");
export const ACCOUNT_REPOSITORY = Symbol("Repositories.Account.Contract");

export const REPOSITORIES: Provider[] = [
    {
        provide: NOTIFICATION_REPOSITORY,
        useClass: NotificationRepository,
    },
    {
        provide: IDENTIFIER_REPOSITORY,
        useClass: IdentifierRepository,
    },
    {
        provide: PROFILE_REPOSITORY,
        useClass: ProfileRepository,
    },
    {
        provide: ACCOUNT_REPOSITORY,
        useClass: AccountRepository,
    },
];
