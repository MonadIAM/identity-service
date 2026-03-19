import { Injectable, Scope } from "@nestjs/common";

import { NotificationCategory, NotificationSource, IdentityActionType, IdentityEntityType } from "~context/enums";
import { AuditJournal, Notification, RecoveryCode } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class RecoveryCodeService implements Services.RecoveryCode.Contract {
    public generate({ input, transaction }: Services.RecoveryCode.Generate): void {
        for (const hash of input.hashes) {
            transaction.persist(new RecoveryCode({ account: input.account, hash }));
        }
    }

    public regenerate({ transaction, context: { userAgent, ip }, input }: Services.RecoveryCode.Regenerate): void {
        for (const code of input.account.recoveryCodes) {
            transaction.remove(code);
        }

        this.generate({ transaction, input });

        const auditEntity = new AuditJournal({
            actionType: IdentityActionType.REGENERATE_RECOVERY_CODES,
            entityType: IdentityEntityType.RECOVERY_CODE,
            entity: input.account.id,
            at: new Date(),
            userAgent,
            ip,
        });

        const notificationEntity = new Notification({
            category: NotificationCategory.SECURITY,
            source: NotificationSource.IDENTITY,
            title: "Recovery codes regenerated",
            body: "Your recovery codes have been regenerated. Previous codes are no longer valid.",
            account: input.account,
        });

        transaction.persist(auditEntity);
        transaction.persist(notificationEntity);
    }
}
