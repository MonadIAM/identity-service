import { Injectable, Scope } from "@nestjs/common";

import { RecoveryCode } from "~context/domain/entities";

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
    }
}
