import { Injectable, Scope } from "@nestjs/common";

import { NotificationCategory, NotificationSource, IdentityActionType, IdentityEntityType } from "~context/enums";
import { AuditJournal, Notification, PasswordHistory } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class CredentialService implements Services.Credential.Contract {
    public async changePassword({
        transaction,
        context: { userAgent, ip },
        input: { password, newHash },
    }: Services.Credential.ChangePassword): Promise<void> {
        const previous = password.rotate(newHash);

        const historyEntity = new PasswordHistory({
            version: previous.version,
            account: password.account,
            hash: previous.hash,
        });

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.CHANGE_PASSWORD,
            entityType: IdentityEntityType.PASSWORD,
            entity: password.account.id,
            at: password.setAt,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Password changed",
            body: "Your password has been changed.",
            account: password.account,
        });

        transaction.persist(historyEntity);
        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);

        await transaction.flush();
    }

    public async resetPassword({
        transaction,
        context: { userAgent, ip },
        input: { password, newHash },
    }: Services.Credential.ResetPassword): Promise<void> {
        const previous = password.rotate(newHash);

        const historyEntity = new PasswordHistory({
            version: previous.version,
            hash: previous.hash,
            account: password.account,
        });

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.RESET_PASSWORD,
            entityType: IdentityEntityType.PASSWORD,
            entity: password.account.id,
            at: password.setAt,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Password reset",
            body: "Your password has been reset.",
            account: password.account,
        });

        transaction.persist(historyEntity);
        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);

        await transaction.flush();
    }
}
