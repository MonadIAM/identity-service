import { Injectable, Scope } from "@nestjs/common";

import { NotificationCategory, NotificationSource } from "~context/enums";
import { Identifier, Notification } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class IdentifierService implements Services.Identifier.Contract {
    public create({ transaction, input }: Services.Identifier.Create): Identifier {
        const identifierEntity = new Identifier({
            providerUserId: input.identifier.providerUserId,
            provider: input.identifier.provider,
            value: input.identifier.value,
            type: input.identifier.type,
            account: input.account,
        });

        transaction.persist(identifierEntity);

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "",
                body: "",
                account: input.account,
            }),
        );

        return identifierEntity;
    }

    public purge({ transaction, input }: Services.Identifier.Purge): void {
        input.identifier.canRemove();

        transaction.remove(input.identifier);

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "Identifier removed",
                body: `Your ${input.identifier.type} identifier has been removed.`,
                account: input.identifier.account,
            }),
        );
    }

    public verify({ transaction, input }: Services.Identifier.Verify): void {
        input.identifier.verify();

        transaction.persist(
            new Notification({
                category: NotificationCategory.ACCOUNT,
                source: NotificationSource.IDENTITY,
                title: "Identifier verified",
                body: `Your ${input.identifier.type} has been verified.`,
                account: input.identifier.account,
            }),
        );
    }

    public setPrimary({ transaction, input }: Services.Identifier.SetPrimary): void {
        input.identifier.canSetAsPrimary();
        input.identifier.account.setPrimaryIdentifier(input.identifier);

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "Primary identifier changed",
                body: `Your primary identifier has been changed to ${input.identifier.type}.`,
                account: input.identifier.account,
            }),
        );
    }

    public toggleNotifications({ input }: Services.Identifier.ToggleNotifications): void {
        input.identifier.toggleNotifications();
    }

    public togglePasswordlessLogin({ input }: Services.Identifier.TogglePasswordlessLogin): void {
        input.identifier.togglePasswordlessLogin();
    }
}
