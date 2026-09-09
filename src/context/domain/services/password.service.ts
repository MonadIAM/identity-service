import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import ms, { StringValue } from "ms";

import { HASHING_SERVICE } from "~common/services";
import { Exception } from "~common/exceptions";
import {
    PASSWORD_HISTORY_REPOSITORY,
    IDENTIFIER_REPOSITORY,
    ACCOUNT_REPOSITORY,
} from "~context/infrastructure/repositories";

import { PasswordHistory } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class PasswordService implements Services.Password.Contract {
    private readonly dictionaryPath = "services.password";
    private readonly historyCheckWindowMs: number;

    public constructor(
        @Inject(PASSWORD_HISTORY_REPOSITORY)
        private readonly passwordHistoryRepository: Repositories.PasswordHistory.PublicContract,
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.PublicContract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.PublicContract,
        @Inject(HASHING_SERVICE)
        private readonly hashingService: CommonServices.Hashing.PublicContract,
        private readonly configService: ConfigService,
    ) {
        this.historyCheckWindowMs = ms(this.configService.getOrThrow<StringValue>("PASSWORD_HISTORY_CHECK_DAYS"));
    }

    public async change(props: Services.Password.Change.Props): Services.Password.Change.Result {
        const { transaction, input } = props;
        const account = await this.accountRepository.findUniqueOrThrow({
            options: { populate: ["password"] },
            where: { id: input.account },
            transaction,
        });

        if (account.password) {
            const isValid = await this.hashingService.verify({
                storedHash: account.password.hash,
                value: input.currentPassword,
            });

            if (isValid) {
                await this.checkHistory({ account: input.account, password: input.newPassword });
                const newHash = await this.hashingService.hash({ value: input.newPassword });

                this.rotate({ input: { password: account.password, newHash }, transaction });
            } else {
                throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_CURRENT_PASSWORD` });
            }
        } else {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.NO_PASSWORD_SET` });
        }
    }

    public async resetByOTP(props: Services.Password.ResetByOTP.Props): Services.Password.ResetByOTP.Result {
        const { transaction, input } = props;

        await this.checkHistory({ account: input.account, password: input.password });

        const account = await this.accountRepository.findUniqueOrThrow({
            options: { populate: ["password"] },
            where: { id: input.account },
            transaction,
        });

        if (account.password) {
            const newHash = await this.hashingService.hash({ value: input.password });
            this.rotate({ input: { password: account.password, newHash }, transaction });
        } else {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.NO_PASSWORD_SET` });
        }
    }

    public async resetByRecoveryCode(
        props: Services.Password.ResetByRecoveryCode.Props,
    ): Services.Password.ResetByRecoveryCode.Result {
        const { transaction, input } = props;
        const { account } = await this.identifierRepository.findUniqueOrThrow({
            options: { populate: ["account.password", "account.recoveryCodes"] },
            where: { identity: input.identifier },
            transaction,
        });

        const codes = account.recoveryCodes.getItems().filter(({ usedAt }) => !usedAt);
        const matched = await this.findMatchingRecoveryCode({ plaintext: input.code, codes });

        if (matched) {
            await this.checkHistory({ account: account.id, password: input.password });

            if (account.password) {
                const newHash = await this.hashingService.hash({ value: input.password });

                matched.use();

                this.rotate({
                    input: { password: account.password, newHash },
                    transaction,
                });

                return account;
            } else {
                throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.NO_PASSWORD_SET` });
            }
        } else {
            throw Exception.badRequest({ messageKey: `${this.dictionaryPath}.INVALID_RECOVERY_CODE` });
        }
    }

    public rotate(props: Services.Password.Rotate.Props): Services.Password.Rotate.Result {
        const { transaction, input } = props;
        const previous = input.password.rotate(input.newHash);

        transaction.persist(
            new PasswordHistory({
                account: input.password.account,
                version: previous.version,
                hash: previous.hash,
            }),
        );
    }

    public async checkHistory(props: Services.Password.CheckHistory.Props): Services.Password.CheckHistory.Result {
        const { password, account } = props;
        const since = new Date(Date.now() - this.historyCheckWindowMs);

        const history = await this.passwordHistoryRepository.find({
            where: { account, setAt: { $gte: since } },
        });

        const results = await Promise.all(
            history.map(({ hash }) => this.hashingService.verify({ value: password, storedHash: hash })),
        );

        if (results.some((isReused) => isReused)) {
            throw Exception.conflict({ messageKey: `${this.dictionaryPath}.RECENTLY_USED` });
        }
    }

    public async findMatchingRecoveryCode(
        props: Services.Password.FindMatchingRecoveryCode.Props,
    ): Services.Password.FindMatchingRecoveryCode.Result {
        const { plaintext, codes } = props;
        const results = await Promise.all(
            codes.map(async (entry) => ({
                isValid: await this.hashingService.verify({
                    storedHash: entry.hash,
                    value: plaintext,
                }),
                entry,
            })),
        );

        return results.find(({ isValid }) => isValid)?.entry ?? null;
    }
}
