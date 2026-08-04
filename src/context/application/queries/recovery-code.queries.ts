import { Inject, Injectable, Scope } from "@nestjs/common";

import { RECOVERY_CODE_REPOSITORY } from "~context/domain/repositories";

@Injectable({ scope: Scope.DEFAULT })
export class RecoveryCodeQueries implements Queries.RecoveryCode.Contract {
    public constructor(
        @Inject(RECOVERY_CODE_REPOSITORY)
        private readonly recoveryCodeRepository: Repositories.RecoveryCode.QueryContract,
    ) {}

    public getStatus(props: Queries.RecoveryCode.GetStatus.Props): Queries.RecoveryCode.GetStatus.Result {
        return this.recoveryCodeRepository.getStatus({
            account: props.account,
        });
    }
}
