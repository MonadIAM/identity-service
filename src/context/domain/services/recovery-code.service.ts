import { Injectable, Scope } from "@nestjs/common";

import { NotificationCategory, NotificationSource, IdentityActionType, IdentityEntityType } from "~context/enums";
import { AuditJournal, Notification, RecoveryCode } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class RecoveryCodeService implements Services.RecoveryCode.Contract {
    public async generate({
        transaction,
        context: { userAgent, ip },
        input: { account, hashes },
    }: Services.RecoveryCode.Generate): Promise<void> {
        const existing = await account.recoveryCodes.loadItems();

        for (const code of existing) {
            transaction.remove(code);
        }

        for (const hash of hashes) {
            const code = new RecoveryCode({
                hash,
                account,
            });

            transaction.persist(code);
        }

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.REGENERATE_RECOVERY_CODES,
            entityType: IdentityEntityType.RECOVERY_CODE,
            at: new Date(),
            entity: account.id,
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Recovery codes regenerated",
            body: "Your recovery codes have been regenerated. Previous codes are no longer valid.",
            account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);

        await transaction.flush();
    }
}
