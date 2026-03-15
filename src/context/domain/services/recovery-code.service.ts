import { Injectable, Scope } from "@nestjs/common";

import { NotificationCategory, NotificationSource, IdentityActionType, IdentityEntityType } from "~context/enums";
import { AuditJournal, Notification, RecoveryCode } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class RecoveryCodeService implements Services.RecoveryCode.Contract {
    public async generate({ input: { account, hashes }, transaction }: Services.RecoveryCode.Generate): Promise<void> {
        for (const hash of hashes) {
            transaction.persist(new RecoveryCode({ account, hash }));
        }
        await transaction.flush();
    }

    public async regenerate({
        context: { userAgent, ip },
        input: { account, hashes },
        transaction,
    }: Services.RecoveryCode.Regenerate): Promise<void> {
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
            entity: account.id,
            at: new Date(),
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
