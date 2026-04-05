import { Inject, Injectable, Scope } from "@nestjs/common";
import { TOTP, Secret } from "otpauth";

import { SECOND_FACTOR_REPOSITORY, IDENTIFIER_REPOSITORY, ACCOUNT_REPOSITORY } from "~context/infrastructure/repositories";
import { IdentityActionType, IdentityEntityType, SecondFactorType } from "~context/enums";
import { HASHING_SERVICE, CRYPTO_SERVICE } from "~common/services";
import { SECOND_FACTOR_SERVICE } from "~context/domain/services";
import { TRANSACTIONAL_SERVICE } from "~common/tracking";
import { CommandException } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorCommands implements Commands.SecondFactor.Contract {
    private readonly dictionaryPath = "commands.second-factor";
    private readonly resource = "SecondFactor";

    public constructor(
        @Inject(TRANSACTIONAL_SERVICE)
        private readonly transactional: Tracking.Transactional.Contract,
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
    ) {}

    public async create(props: Commands.SecondFactor.Create.Props): Promise<Commands.SecondFactor.Create.Result> {
        const secret = new Secret({ size: 20 });

        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.CREATE_SECOND_FACTOR,
                entityType: IdentityEntityType.ACCOUNT,
                ...props,
            },
            execute: async (transaction) => {
                const account = await this.accountRepository.findUniqueOrThrow({
                    where: { id: props.actor },
                    transaction,
                });

                this.secondFactorService.create({
                    transaction,
                    input: {
                        account,
                        type: SecondFactorType.TOTP,
                        name: props.input.name,
                        secret: secret.base32,
                    },
                });
            },
        });

        const totp = new TOTP({
            label: props.actor,
            issuer: "LIAM",
            secret,
        });

        return { uri: totp.toString() };
    }

    public async confirm(props: Commands.SecondFactor.Confirm.Props): Promise<Commands.SecondFactor.Confirm.Result> {
        const factor = await this.secondFactorRepository.findUniqueOrThrow({
            options: { populate: ["account.masterCode"] },
            where: {
                id: props.input.factor,
                account: props.actor,
            },
        });

        const hasMasterCode = factor.account.masterCode;
        const totp = new TOTP({ secret: Secret.fromBase32(factor.secret) });
        const isValid = totp.validate({ token: props.input.code, window: 1 }) !== null;

        if (isValid) {
            const masterCodePlaintext = this.cryptoService.generateRecoveryCode();
            const masterCodeHash = await this.hashingService.hash({ value: masterCodePlaintext });

            await this.transactional.run({
                resource: this.resource,
                audit: {
                    actionType: IdentityActionType.CONFIRM_SECOND_FACTOR,
                    entityType: IdentityEntityType.ACCOUNT,
                    ...props,
                },
                execute: (transaction) => {
                    transaction.merge(factor);
                    this.secondFactorService.confirm({
                        input: { factor, masterCodeHash },
                        transaction,
                    });
                },
            });

            return {
                message: `${this.dictionaryPath}.CONFIRMED`,
                code: hasMasterCode ? undefined : masterCodePlaintext,
            };
        } else {
            throw CommandException.unauthorized(`${this.dictionaryPath}.INVALID_TOTP_CODE`);
        }
    }

    public async purge(props: Commands.SecondFactor.Purge): Promise<MessageResult> {
        await this.transactional.run({
            resource: this.resource,
            audit: {
                actionType: IdentityActionType.PURGE_SECOND_FACTORS,
                entityType: IdentityEntityType.ACCOUNT,
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

                this.secondFactorService.purge({
                    input: { factor },
                    transaction,
                });
            },
        });

        return { message: `${this.dictionaryPath}.PURGED` };
    }

    public async reset(props: Commands.SecondFactor.Reset): Promise<MessageResult> {
        const identifier = await this.identifierRepository.findUnique({
            options: { populate: ["account.masterCode", "account.secondFactors"] },
            where: { value: props.input.identifier },
        });

        if (identifier?.account?.masterCode) {
            const isValid = await this.hashingService.verify({
                storedHash: identifier.account.masterCode.hash,
                value: props.input.code,
            });

            if (isValid) {
                await this.transactional.run({
                    resource: this.resource,
                    audit: {
                        actionType: IdentityActionType.RESET_SECOND_FACTORS,
                        entityType: IdentityEntityType.ACCOUNT,
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
            } else {
                throw CommandException.unauthorized(`${this.dictionaryPath}.INVALID_CODE`);
            }
        } else {
            throw CommandException.unauthorized(`${this.dictionaryPath}.INVALID_CODE`);
        }
    }
}
