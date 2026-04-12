import { Injectable, Scope } from "@nestjs/common";

import { MasterCode, SecondFactor } from "~context/domain/entities";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorService implements Services.SecondFactor.Contract {
    public create({ transaction, input }: Services.SecondFactor.Create): SecondFactor {
        const factor = new SecondFactor({
            account: input.account,
            secret: input.secret,
            type: input.type,
            name: input.name,
        });

        transaction.persist(factor);

        return factor;
    }

    public verify({ transaction, input }: Services.SecondFactor.Verify): void {
        input.factor.confirm();

        if (!input.factor.account.masterCode) {
            transaction.persist(
                new MasterCode({
                    hash: input.masterCodeHash,
                    account: input.factor.account,
                }),
            );
        }
    }

    public purge({ transaction, input }: Services.SecondFactor.Purge): void {
        transaction.remove(input.factor);

        if (input.factor.account.masterCode) {
            transaction.remove(input.factor.account.masterCode);
        }
    }

    public reset({ transaction, input }: Services.SecondFactor.Reset): void {
        for (const factor of input.account.secondFactors.getItems()) {
            transaction.remove(factor);
        }

        if (input.account.masterCode) {
            transaction.remove(input.account.masterCode);
        }
    }
}
