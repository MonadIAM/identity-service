import { Injectable, Scope } from "@nestjs/common";

import { MasterCode, SecondFactor } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorService implements Services.SecondFactor.Contract {
    public create(props: Services.SecondFactor.Create.Props): Services.SecondFactor.Create.Result {
        const { transaction, input } = props;
        const factor = new SecondFactor({
            account: input.account,
            secret: input.secret,
            type: input.type,
            name: input.name,
        });

        transaction.persist(factor);

        return factor;
    }

    public verify(props: Services.SecondFactor.Verify.Props): Services.SecondFactor.Verify.Result {
        const { transaction, input } = props;
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

    public rewrap(props: Services.SecondFactor.Rewrap.Props): Services.SecondFactor.Rewrap.Result {
        const { transaction, input } = props;
        input.factor.rewrap(input.secret);
        transaction.merge(input.factor);
    }

    public purge(props: Services.SecondFactor.Purge.Props): Services.SecondFactor.Purge.Result {
        const { transaction, input } = props;

        let masterCode: Optional<Entities.MasterCode>;
        let remaining = 0;

        for (const factor of input.factors) {
            if (factor.id === input.target) {
                ({ masterCode } = factor.account);
                transaction.remove(factor);
            } else if (factor.confirmedAt) {
                ++remaining;
            }
        }

        if (!remaining && masterCode) {
            transaction.remove(masterCode);
        }
    }

    public reset(props: Services.SecondFactor.Reset.Props): Services.SecondFactor.Reset.Result {
        const { transaction, input } = props;
        for (const factor of input.account.secondFactors.getItems()) {
            transaction.remove(factor);
        }

        if (input.account.masterCode) {
            transaction.remove(input.account.masterCode);
        }
    }
}
