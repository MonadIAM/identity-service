import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { INTERFACE_CLIENT_REPOSITORY } from "~context/infrastructure/repositories";
import { TokenGrantType } from "~context/enums";
import { Exception } from "~common/exceptions";

import { InterfaceClient } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class InterfaceClientService implements Services.InterfaceClient.Contract {
    private readonly dictionaryPath = "services.interface-client";
    private readonly grantTypes: TokenGrantType[] = [TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN];
    private readonly redirectUriLimit: number;

    public constructor(
        @Inject(INTERFACE_CLIENT_REPOSITORY)
        private readonly interfaceClientRepository: Repositories.InterfaceClient.PublicContract,
        configService: ConfigService,
    ) {
        this.redirectUriLimit = configService.getOrThrow<number>("INTERFACE_CLIENT_REDIRECT_URI_LIMIT");
    }

    public async create(props: Services.InterfaceClient.Create.Props): Services.InterfaceClient.Create.Result {
        const { transaction, realm, input } = props;

        this.validateRedirectUris({ redirectUris: input.redirectUris });
        this.validateAuthAddress({ authAddress: input.authAddress });

        const limitExceeded = await this.interfaceClientRepository.wouldExceedRealmLimit({
            realm,
            transaction,
        });

        if (limitExceeded) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.REALM_LIMIT_EXCEEDED` });
        } else {
            const entity = new InterfaceClient({ ...input, grantTypes: [...this.grantTypes], realm });
            transaction.persist(entity);
            return entity;
        }
    }

    public async update(props: Services.InterfaceClient.Update.Props): Services.InterfaceClient.Update.Result {
        const { transaction, realm, patch, id } = props;
        const entity = await this.interfaceClientRepository.findUniqueOrThrow({
            where: { id, realm },
            transaction,
        });

        if (patch.redirectUris) {
            this.validateRedirectUris({ redirectUris: patch.redirectUris });
        }

        if (patch.authAddress) {
            this.validateAuthAddress({ authAddress: patch.authAddress });
        }

        entity.update(patch);
    }

    public async revoke(props: Services.InterfaceClient.Revoke.Props): Services.InterfaceClient.Revoke.Result {
        const { transaction, identifiers, realm } = props;
        const unique = Array.from(new Set(identifiers));
        const entities = await this.interfaceClientRepository.find({
            where: { id: { $in: unique }, realm },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.revoke();
            }

            return entities;
        }
    }

    public async restore(props: Services.InterfaceClient.Restore.Props): Services.InterfaceClient.Restore.Result {
        const { transaction, identifiers, realm } = props;
        const unique = Array.from(new Set(identifiers));
        const entities = await this.interfaceClientRepository.find({
            where: { id: { $in: unique }, realm },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.restore();
            }

            return entities;
        }
    }

    public async purge(props: Services.InterfaceClient.Purge.Props): Services.InterfaceClient.Purge.Result {
        const { transaction, identifiers, realm } = props;
        const unique = Array.from(new Set(identifiers));
        const entities = await this.interfaceClientRepository.find({
            where: { id: { $in: unique }, realm },
            transaction,
        });

        if (entities.length < unique.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.canPurge();
                transaction.remove(entity);
            }

            return entities;
        }
    }

    public validateRedirectUris(
        props: Services.InterfaceClient.ValidateRedirectUris.Props,
    ): Services.InterfaceClient.ValidateRedirectUris.Result {
        const { redirectUris } = props;

        if (!redirectUris.length) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.REDIRECT_URI_REQUIRED` });
        }

        if (redirectUris.length > this.redirectUriLimit) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.REDIRECT_URI_LIMIT_EXCEEDED` });
        }

        if (new Set(redirectUris).size !== redirectUris.length) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.REDIRECT_URI_DUPLICATED` });
        }

        for (const redirectUri of redirectUris) {
            this.validateRedirectUri({ redirectUri });
        }
    }

    public validateRedirectUri(
        props: Services.InterfaceClient.ValidateRedirectUri.Props,
    ): Services.InterfaceClient.ValidateRedirectUri.Result {
        const { redirectUri } = props;

        try {
            if (!redirectUri.length) {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.REDIRECT_URI_REQUIRED` });
            }

            const url = new URL(redirectUri);

            if (url.hash) {
                throw Exception.invariantViolation({
                    messageKey: `${this.dictionaryPath}.REDIRECT_URI_FRAGMENT_NOT_ALLOWED`,
                });
            }
        } catch (error) {
            if (error instanceof Exception) {
                throw error;
            } else {
                throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.INVALID_REDIRECT_URI` });
            }
        }
    }

    public validateAuthAddress(
        props: Services.InterfaceClient.ValidateAuthAddress.Props,
    ): Services.InterfaceClient.ValidateAuthAddress.Result {
        const { authAddress } = props;

        if (!authAddress.length) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.AUTH_ADDRESS_REQUIRED` });
        }

        if (!URL.canParse(authAddress)) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.INVALID_AUTH_ADDRESS` });
        }
    }

    public async applyRealmRevocation(
        props: Services.InterfaceClient.ApplyRealmRevocation.Props,
    ): Services.InterfaceClient.ApplyRealmRevocation.Result {
        const { transaction, version, realm } = props;
        const entities = await this.interfaceClientRepository.find({
            where: { realm, realmVersion: { $lt: version }, isSystemManaged: false },
            transaction,
        });

        for (const entity of entities) {
            entity.applyRealmRevocation(version);
        }

        return entities;
    }

    public async applyRealmRestore(
        props: Services.InterfaceClient.ApplyRealmRestore.Props,
    ): Services.InterfaceClient.ApplyRealmRestore.Result {
        const { transaction, version, realm } = props;
        const entities = await this.interfaceClientRepository.find({
            where: { realm, realmVersion: { $lt: version }, isSystemManaged: false },
            transaction,
        });

        for (const entity of entities) {
            entity.applyRealmRestore(version);
        }

        return entities;
    }

    public async purgeRealm(props: Services.InterfaceClient.PurgeRealm.Props): Services.InterfaceClient.PurgeRealm.Result {
        const { transaction, version, realm } = props;
        const entities = await this.interfaceClientRepository.find({
            where: { realm, realmVersion: { $lt: version }, isSystemManaged: false },
            transaction,
        });

        for (const entity of entities) {
            transaction.remove(entity);
        }

        return entities;
    }
}
