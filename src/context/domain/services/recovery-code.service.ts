import { Injectable, Scope } from "@nestjs/common";

import { NotificationCategory, NotificationSource } from "~context/enums";
import { Notification, RecoveryCode } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class RecoveryCodeService implements Services.RecoveryCode.Contract {
    public generate({ transaction, input }: Services.RecoveryCode.Generate): void {
        for (const hash of input.hashes) {
            transaction.persist(new RecoveryCode({ account: input.account, hash }));
        }
    }

    public regenerate({ transaction, input }: Services.RecoveryCode.Regenerate): void {
        for (const code of input.account.recoveryCodes) {
            transaction.remove(code);
        }

        this.generate({ transaction, input });

        transaction.persist(
            new Notification({
                category: NotificationCategory.SECURITY,
                source: NotificationSource.IDENTITY,
                title: "Recovery codes regenerated",
                body: "Your recovery codes have been regenerated. Previous codes are no longer valid.",
                account: input.account,
            }),
        );
    }
}
