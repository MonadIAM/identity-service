import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";

import { RecoveryCode } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class RecoveryCodeService implements Services.RecoveryCode.Contract {
    public constructor(
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.PublicContract,
    ) {}

    public generate(props: Services.RecoveryCode.Generate.Props): Services.RecoveryCode.Generate.Result {
        const { transaction, input } = props;
        for (const hash of input.hashes) {
            transaction.persist(new RecoveryCode({ account: input.account, hash }));
        }
    }

    public async regenerate(props: Services.RecoveryCode.Regenerate.Props): Services.RecoveryCode.Regenerate.Result {
        const { transaction, input } = props;
        const account = await this.accountRepository.findUniqueOrThrow({
            options: { populate: ["recoveryCodes"] },
            where: { id: input.account },
            transaction,
        });

        for (const code of account.recoveryCodes) {
            transaction.remove(code);
        }

        this.generate({ transaction, input: { hashes: input.hashes, account } });
    }
}
