import { Inject, Injectable, Scope } from "@nestjs/common";
import { LockMode } from "@mikro-orm/postgresql";

import { SECOND_FACTOR_REPOSITORY, ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { SECOND_FACTOR_SECRET_SERVICE } from "~context/infrastructure/services/tokens";
import { HASHING_SERVICE, TOTP_SERVICE } from "~common/services";
import { Exception } from "~common/exceptions";

import { MasterCode, SecondFactor } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorService implements Services.SecondFactor.Contract {
    private readonly dictionaryPath = "services.second-factor";

    public constructor(
        @Inject(SECOND_FACTOR_SECRET_SERVICE)
        private readonly secondFactorSecretService: InfrastructureServices.SecondFactorSecret.PublicContract,
        @Inject(SECOND_FACTOR_REPOSITORY)
        private readonly secondFactorRepository: Repositories.SecondFactor.PublicContract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.PublicContract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.PublicContract,
        @Inject(TOTP_SERVICE)
        private readonly totpService: CommonServices.TOTP.PublicContract,
    ) {}

    public async create(props: Services.SecondFactor.Create.Props): Services.SecondFactor.Create.Result {
        const { transaction, input } = props;
        const [account, existingFactor] = await Promise.all([
            this.accountRepository.findUniqueOrThrow({
                where: { id: input.account },
                transaction,
            }),
            this.secondFactorRepository.findUnique({
                where: { account: input.account, type: input.type },
                transaction,
            }),
        ]);

        if (existingFactor) {
            throw Exception.conflict({ messageKey: `${this.dictionaryPath}.TOTP_FACTOR_EXISTS` });
        } else {
            const factor = new SecondFactor({
                secret: input.secret,
                type: input.type,
                name: input.name,
                account,
            });

            transaction.persist(factor);

            return factor;
        }
    }

    public async verify(props: Services.SecondFactor.Verify.Props): Services.SecondFactor.Verify.Result {
        const { transaction, input } = props;
        const factor = await this.secondFactorRepository.findUniqueOrThrow({
            options: { populate: ["account.masterCode"], lockMode: LockMode.PESSIMISTIC_WRITE },
            where: { id: input.factor, account: input.account },
            transaction,
        });

        await this.acceptCode({ input: { factor, code: input.code } });

        factor.confirm();

        if (!factor.account.masterCode) {
            transaction.persist(
                new MasterCode({
                    hash: input.masterCodeHash,
                    account: factor.account,
                }),
            );
        }

        return factor;
    }

    public async authenticate(props: Services.SecondFactor.Authenticate.Props): Services.SecondFactor.Authenticate.Result {
        const { transaction, input } = props;
        const factor = await this.secondFactorRepository.findUnique({
            options: { populate: ["account"], lockMode: LockMode.PESSIMISTIC_WRITE },
            where: {
                confirmedAt: { $ne: null },
                account: input.account,
            },
            transaction,
        });

        if (factor) {
            await this.acceptCode({ input: { factor, code: input.code } });
            return factor;
        } else {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.NO_ACTIVE_2FA` });
        }
    }

    public async reauthenticate(
        props: Services.SecondFactor.Reauthenticate.Props,
    ): Services.SecondFactor.Reauthenticate.Result {
        const { transaction, input } = props;
        const factor = await this.secondFactorRepository.findUnique({
            options: { lockMode: LockMode.PESSIMISTIC_WRITE },
            where: {
                confirmedAt: { $ne: null },
                account: input.account,
            },
            transaction,
        });

        if (factor) {
            await this.acceptCode({ input: { factor, code: input.code } });
            return factor;
        } else {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.NO_ACTIVE_2FA` });
        }
    }

    public async purge(props: Services.SecondFactor.Purge.Props): Services.SecondFactor.Purge.Result {
        const { transaction, input } = props;
        const where: ORM.ObjectQuery<Entities.SecondFactor> = { account: input.account };

        if (input.confirmedAt === null) {
            where.$or = [{ id: { $ne: input.target } }, { confirmedAt: null }];
        }

        const factors = await this.secondFactorRepository.find({
            options: { populate: ["account.masterCode"], lockMode: LockMode.PESSIMISTIC_WRITE },
            transaction,
            where,
        });

        let masterCode: Optional<Entities.MasterCode>;
        let remaining = 0;

        for (const factor of factors) {
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

    public async reset(props: Services.SecondFactor.Reset.Props): Services.SecondFactor.Reset.Result {
        const { transaction, input } = props;
        const where: ORM.ObjectQuery<Entities.Account> = {};

        if ("account" in input) {
            where.id = input.account;
        } else {
            where.identifiers = { identity: input.identifier };
        }

        const account = await this.accountRepository.findUnique({
            options: { populate: ["masterCode", "secondFactors"] },
            transaction,
            where,
        });

        if (account?.masterCode) {
            const isValid = await this.hashingService.verify({
                storedHash: account.masterCode.hash,
                value: input.code,
            });

            if (isValid) {
                for (const factor of account.secondFactors.getItems()) {
                    transaction.remove(factor);
                }

                transaction.remove(account.masterCode);

                return account;
            } else {
                throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_CODE` });
            }
        } else {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_CODE` });
        }
    }

    public async acceptCode(props: Services.SecondFactor.AcceptCode.Props): Services.SecondFactor.AcceptCode.Result {
        const { input } = props;
        const { ciphertext, plaintext } = await this.secondFactorSecretService.resolve({
            secret: input.factor.secret,
        });

        const verification = this.totpService.verify({ secret: plaintext, code: input.code });

        if (verification) {
            const accepted = input.factor.acceptTOTP(verification.step);

            if (accepted) {
                if (ciphertext) {
                    input.factor.rewrap(ciphertext);
                }
            } else {
                throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_TOTP_CODE` });
            }
        } else {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_TOTP_CODE` });
        }
    }
}
