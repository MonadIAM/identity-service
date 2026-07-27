import { Injectable, Scope } from "@nestjs/common";

import { RecoveryCode } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class RecoveryCodeService implements Services.RecoveryCode.Contract {
    public generate(props: Services.RecoveryCode.Generate.Props): Services.RecoveryCode.Generate.Result {
        const { transaction, input } = props;
        for (const hash of input.hashes) {
            transaction.persist(new RecoveryCode({ account: input.account, hash }));
        }
    }

    public regenerate(props: Services.RecoveryCode.Regenerate.Props): Services.RecoveryCode.Regenerate.Result {
        const { transaction, input } = props;
        for (const code of input.account.recoveryCodes) {
            transaction.remove(code);
        }

        this.generate({ transaction, input });
    }
}
