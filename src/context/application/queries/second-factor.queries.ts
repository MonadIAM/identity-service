import { Inject, Injectable, Scope } from "@nestjs/common";
import { TOTP, Secret } from "otpauth";

import { SECOND_FACTOR_REPOSITORY } from "~context/infrastructure/repositories";
import { CommandException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorQueries implements Queries.SecondFactor.Contract {
    private readonly dictionaryPath = "queries.second-factor";

    public constructor(
        @Inject(SECOND_FACTOR_REPOSITORY)
        private readonly secondFactorRepository: Repositories.SecondFactor.Contract,
    ) {}

    public findMany(props: Queries.SecondFactor.FindMany.Props): Queries.SecondFactor.FindMany.Result {
        return this.secondFactorRepository.findMany({
            where: { account: props.account },
        });
    }

    public async getQRCode(props: Queries.SecondFactor.GetQRCode.Props): Queries.SecondFactor.GetQRCode.Result {
        const factor = await this.secondFactorRepository.findUnique({
            where: { account: props.actor, id: props.id },
        });

        if (factor && !factor.confirmedAt) {
            const totp = new TOTP({
                secret: Secret.fromBase32(factor.secret),
                label: props.actor,
                issuer: "LIAM",
            });

            return { id: factor.id, uri: totp.toString() };
        } else {
            throw CommandException.notFound(`${this.dictionaryPath}.QR_UNAVAILABLE`);
        }
    }
}
