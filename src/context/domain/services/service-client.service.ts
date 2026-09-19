import { Inject, Injectable, Scope } from "@nestjs/common";

import { SERVICE_CLIENT_REPOSITORY } from "~context/infrastructure/repositories";
import { Exception } from "~common/exceptions";

import { ServiceClient } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class ServiceClientService implements Services.ServiceClient.Contract {
    private readonly dictionaryPath = "services.service-client";

    public constructor(
        @Inject(SERVICE_CLIENT_REPOSITORY)
        private readonly serviceClientRepository: Repositories.ServiceClient.PublicContract,
    ) {}

    public async create(props: Services.ServiceClient.Create.Props): Services.ServiceClient.Create.Result {
        const { transaction, realm, input } = props;

        const limitExceeded = await this.serviceClientRepository.wouldExceedRealmLimit({
            realm,
            transaction,
        });

        if (limitExceeded) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.REALM_LIMIT_EXCEEDED` });
        } else {
            const entity = new ServiceClient({ ...input, realm });
            transaction.persist(entity);
            return entity;
        }
    }

    public async update(props: Services.ServiceClient.Update.Props): Services.ServiceClient.Update.Result {
        const { transaction, realm, patch, id } = props;
        const entity = await this.serviceClientRepository.findUniqueOrThrow({
            where: { id, realm },
            transaction,
        });

        entity.update(patch);
    }

    public async revoke(props: Services.ServiceClient.Revoke.Props): Services.ServiceClient.Revoke.Result {
        const { transaction, identifiers, realm } = props;
        const unique = Array.from(new Set(identifiers));
        const entities = await this.serviceClientRepository.find({
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

    public async restore(props: Services.ServiceClient.Restore.Props): Services.ServiceClient.Restore.Result {
        const { transaction, identifiers, realm } = props;
        const unique = Array.from(new Set(identifiers));
        const entities = await this.serviceClientRepository.find({
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

    public async purge(props: Services.ServiceClient.Purge.Props): Services.ServiceClient.Purge.Result {
        const { transaction, identifiers, realm } = props;
        const unique = Array.from(new Set(identifiers));
        const entities = await this.serviceClientRepository.find({
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

    public async applyRealmRevocation(
        props: Services.ServiceClient.ApplyRealmRevocation.Props,
    ): Services.ServiceClient.ApplyRealmRevocation.Result {
        const { transaction, version, realm } = props;
        const entities = await this.serviceClientRepository.find({
            where: { realm, realmVersion: { $lt: version }, isSystemManaged: false },
            transaction,
        });

        for (const entity of entities) {
            entity.applyRealmRevocation(version);
        }

        return entities;
    }

    public async applyRealmRestore(
        props: Services.ServiceClient.ApplyRealmRestore.Props,
    ): Services.ServiceClient.ApplyRealmRestore.Result {
        const { transaction, version, realm } = props;
        const entities = await this.serviceClientRepository.find({
            where: { realm, realmVersion: { $lt: version }, isSystemManaged: false },
            transaction,
        });

        for (const entity of entities) {
            entity.applyRealmRestore(version);
        }

        return entities;
    }

    public async purgeRealm(props: Services.ServiceClient.PurgeRealm.Props): Services.ServiceClient.PurgeRealm.Result {
        const { transaction, version, realm } = props;
        const entities = await this.serviceClientRepository.find({
            where: { realm, realmVersion: { $lt: version }, isSystemManaged: false },
            transaction,
        });

        for (const entity of entities) {
            transaction.remove(entity);
        }

        return entities;
    }
}
