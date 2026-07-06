import { Inject, Injectable, Scope } from "@nestjs/common";
import { TOTP, Secret } from "otpauth";

import { SECOND_FACTOR_REPOSITORY, IDENTIFIER_REPOSITORY, ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { SECOND_FACTOR_SECRET_SERVICE } from "~context/infrastructure/services";
import { ActionType, EntityType, SecondFactorType } from "~context/enums";
import { TRANSACTIONAL_SERVICE } from "~common/transaction-manager";
import { HASHING_SERVICE, CRYPTO_SERVICE } from "~common/services";
import { SECOND_FACTOR_SERVICE } from "~context/domain/services";
import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorCommands implements Commands.SecondFactor.Contract {
    private readonly dictionaryPath = "commands.second-factor";
    private readonly resource = "SecondFactor";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactionalService: TransactionManager.Service.Contract,
        @Inject(SECOND_FACTOR_REPOSITORY)
        private readonly secondFactorRepository: Repositories.SecondFactor.Contract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.Contract,
        @Inject(SECOND_FACTOR_SERVICE)
        private readonly secondFactorService: Services.SecondFactor.Contract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.Contract,
        @Inject(CRYPTO_SERVICE)
        private readonly cryptoService: CommonServices.Crypto.Contract,
        @Inject(SECOND_FACTOR_SECRET_SERVICE)
        private readonly secondFactorSecretService: InfrastructureServices.SecondFactorSecret.Contract,
    ) {}

    public async create(props: Commands.SecondFactor.Create.Props): Commands.SecondFactor.Create.Result {
        const secret = new Secret({ size: 20 });
        const ciphertext = await this.secondFactorSecretService.encrypt({ secret: secret.base32 });
        const type = SecondFactorType.TOTP;

        const factor = await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.SECOND_FACTOR,
                actionType: ActionType.CREATE,
                ...props,
            },
            execute: async (transaction) => {
                const [account, existingFactor] = await Promise.all([
                    this.accountRepository.findUniqueOrThrow({
                        where: { id: props.actor },
                        transaction,
                    }),
                    this.secondFactorRepository.findUnique({
                        where: { account: props.actor, type },
                        transaction,
                    }),
                ]);

                if (existingFactor) {
                    throw Exception.conflict({ messageKey: `${this.dictionaryPath}.TOTP_FACTOR_EXISTS` });
                }

                return this.secondFactorService.create({
                    transaction,
                    input: {
                        name: props.input.name,
                        secret: ciphertext,
                        account,
                        type,
                    },
                });
            },
        });

        const totp = new TOTP({
            label: props.actor,
            issuer: "MonadIAM",
            secret,
        });

        return { id: factor.id, uri: totp.toString() };
    }

    public async verify(props: Commands.SecondFactor.Verify.Props): Commands.SecondFactor.Verify.Result {
        const masterCodePlaintext = this.cryptoService.generateRecoveryCode();
        const masterCodeHash = await this.hashingService.hash({ value: masterCodePlaintext });
        let hasMasterCode = false;

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.SECOND_FACTOR,
                actionType: ActionType.VERIFY,
                ...props,
            },
            execute: async (transaction) => {
                const factor = await this.secondFactorRepository.findUniqueOrThrow({
                    options: { populate: ["account.masterCode"] },
                    where: {
                        id: props.input.factor,
                        account: props.actor,
                    },
                    transaction,
                });
                const { ciphertext, plaintext } = await this.secondFactorSecretService.resolve({
                    secret: factor.secret,
                });
                const totp = new TOTP({ secret: Secret.fromBase32(plaintext) });
                const isValid = totp.validate({ token: props.input.code, window: 1 }) !== null;

                if (!isValid) {
                    throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_TOTP_CODE` });
                }

                hasMasterCode = Boolean(factor.account.masterCode);
                if (ciphertext) {
                    this.secondFactorService.rewrap({ input: { factor, secret: ciphertext }, transaction });
                }
                this.secondFactorService.verify({
                    input: { factor, masterCodeHash },
                    transaction,
                });
            },
        });

        return {
            message: `${this.dictionaryPath}.VERIFIED`,
            code: hasMasterCode ? undefined : masterCodePlaintext,
        };
    }

    public async purge(props: Commands.SecondFactor.Purge.Props): Commands.SecondFactor.Purge.Result {
        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.SECOND_FACTOR,
                actionType: ActionType.PURGE,
                ...props,
            },
            execute: async (transaction) => {
                const factors = await this.secondFactorRepository.find({
                    options: { populate: ["account.masterCode"] },
                    where: { account: props.actor },
                    transaction,
                });

                this.secondFactorService.purge({
                    input: { target: props.input.factor, factors },
                    transaction,
                });
            },
        });

        return { message: `${this.dictionaryPath}.PURGED` };
    }

    public async reset(props: Commands.SecondFactor.Reset.Props): Commands.SecondFactor.Reset.Result {
        const identifier = await this.identifierRepository.findUnique({
            options: { populate: ["account.masterCode", "account.secondFactors"] },
            where: { value: props.input.identifier },
        });

        if (!identifier?.account?.masterCode) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_CODE` });
        }

        const isValid = await this.hashingService.verify({
            storedHash: identifier.account.masterCode.hash,
            value: props.input.code,
        });

        if (!isValid) {
            throw Exception.unauthorized({ messageKey: `${this.dictionaryPath}.INVALID_CODE` });
        }

        await this.transactionalService.run({
            resource: this.resource,
            audit: {
                entityType: EntityType.SECOND_FACTOR,
                actionType: ActionType.RESET,
                ...props,
            },
            execute: (transaction) => {
                transaction.merge(identifier.account);
                this.secondFactorService.reset({
                    input: { account: identifier.account },
                    transaction,
                });
            },
        });

        return { message: `${this.dictionaryPath}.RESET` };
    }
}
