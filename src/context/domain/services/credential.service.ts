import { Injectable, Scope } from "@nestjs/common";

import { NotificationCategory, NotificationSource, IdentityActionType, IdentityEntityType } from "~context/enums";
import { AuditJournal, Notification, PasswordHistory } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class CredentialService implements Services.Credential.Contract {
    public changePassword({ transaction, context: { userAgent, ip }, input }: Services.Credential.ChangePassword): void {
        const previous = input.password.rotate(input.newHash);

        const historyEntity = new PasswordHistory({
            account: input.password.account,
            version: previous.version,
            hash: previous.hash,
        });

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.CHANGE_PASSWORD,
            entityType: IdentityEntityType.PASSWORD,
            entity: input.password.account.id,
            at: input.password.setAt,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Password changed",
            body: "Your password has been changed.",
            account: input.password.account,
        });

        transaction.persist(historyEntity);
        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);
    }

    public resetPassword({ transaction, context: { userAgent, ip }, input }: Services.Credential.ResetPassword): void {
        const previous = input.password.rotate(input.newHash);

        const historyEntity = new PasswordHistory({
            account: input.password.account,
            version: previous.version,
            hash: previous.hash,
        });

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.RESET_PASSWORD,
            entityType: IdentityEntityType.PASSWORD,
            entity: input.password.account.id,
            at: input.password.setAt,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Password reset",
            body: "Your password has been reset.",
            account: input.password.account,
        });

        transaction.persist(historyEntity);
        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);
    }
}
