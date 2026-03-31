import { Injectable, Scope } from "@nestjs/common";

import { NotificationCategory, NotificationSource } from "~context/enums";
import { Notification, PasswordHistory } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class CredentialService implements Services.Credential.Contract {
    public changePassword({ transaction, input }: Services.Credential.ChangePassword): void {
        const previous = input.password.rotate(input.newHash);

        transaction.persist(
            new PasswordHistory({
                account: input.password.account,
                version: previous.version,
                hash: previous.hash,
            }),
        );

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "Password changed",
                body: "Your password has been changed.",
                account: input.password.account,
            }),
        );
    }

    public resetPassword({ transaction, input }: Services.Credential.ResetPassword): void {
        const previous = input.password.rotate(input.newHash);

        transaction.persist(
            new PasswordHistory({
                account: input.password.account,
                version: previous.version,
                hash: previous.hash,
            }),
        );

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "Password reset",
                body: "Your password has been reset.",
                account: input.password.account,
            }),
        );
    }
}
