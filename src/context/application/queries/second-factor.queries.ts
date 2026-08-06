import { Inject, Injectable, Scope } from "@nestjs/common";
import { TOTP, Secret } from "otpauth";

import { SECOND_FACTOR_SECRET_SERVICE } from "~context/infrastructure/services";
import { SECOND_FACTOR_REPOSITORY } from "~context/domain/repositories";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { Exception } from "~common/exceptions";

import { SECOND_FACTOR_SERVICE } from "../services";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorQueries implements Queries.SecondFactor.Contract {
    private readonly dictionaryPath = "queries.second-factor";
    private readonly resource = "SecondFactor";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(SECOND_FACTOR_REPOSITORY)
        private readonly secondFactorRepository: Repositories.SecondFactor.QueryContract,
        @Inject(SECOND_FACTOR_SECRET_SERVICE)
        private readonly secondFactorSecretService: InfrastructureServices.SecondFactorSecret.PublicContract,
        @Inject(SECOND_FACTOR_SERVICE)
        private readonly secondFactorService: Services.SecondFactor.QueryContract,
    ) {}

    public findMany(props: Queries.SecondFactor.FindMany.Props): Queries.SecondFactor.FindMany.Result {
        return this.secondFactorRepository.findMany({
            where: { account: props.account },
        });
    }

    public async getQRCode(props: Queries.SecondFactor.GetQRCode.Props): Queries.SecondFactor.GetQRCode.Result {
        let result: Optional<{ id: string; uri: string }>;

        await this.transactionalService.run({
            resource: this.resource,
            execute: async (transaction) => {
                const factor = await this.secondFactorRepository.findUnique({
                    where: { account: props.actor, id: props.id },
                    transaction,
                });

                if (!factor || factor.confirmedAt) {
                    throw Exception.notFound({ messageKey: `${this.dictionaryPath}.QR_UNAVAILABLE` });
                }

                const { ciphertext, plaintext } = await this.secondFactorSecretService.resolve({
                    secret: factor.secret,
                });
                if (ciphertext) {
                    this.secondFactorService.rewrap({ input: { factor, secret: ciphertext }, transaction });
                }

                const totp = new TOTP({
                    secret: Secret.fromBase32(plaintext),
                    label: props.actor,
                    issuer: "MonadIAM",
                });

                result = { id: factor.id, uri: totp.toString() };
            },
        });

        return result!;
    }
}
