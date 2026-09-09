import { Inject, Injectable, Scope } from "@nestjs/common";

import { SERVICE_CLIENT_REPOSITORY, APPLICATION_REPOSITORY } from "~context/infrastructure/repositories";
import { Exception } from "~common/exceptions";

import { ServiceClient } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class ServiceClientService implements Services.ServiceClient.Contract {
    private readonly dictionaryPath = "services.service-client";

    public constructor(
        @Inject(SERVICE_CLIENT_REPOSITORY)
        private readonly serviceClientRepository: Repositories.ServiceClient.PublicContract,
        @Inject(APPLICATION_REPOSITORY)
        private readonly applicationRepository: Repositories.Application.PublicContract,
    ) {}

    public async create(props: Services.ServiceClient.Create.Props): Services.ServiceClient.Create.Result {
        const { transaction, realm, input } = props;

        const application = await this.applicationRepository.findUniqueOrThrow({
            where: { id: input.application, realm },
            transaction,
        });

        const limitExceeded = await this.serviceClientRepository.wouldExceedApplicationLimit({
            application: application.id,
            transaction,
        });

        if (limitExceeded) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.APPLICATION_LIMIT_EXCEEDED` });
        } else {
            const entity = new ServiceClient({ ...input, application });
            transaction.persist(entity);
            return entity;
        }
    }

    public async update(props: Services.ServiceClient.Update.Props): Services.ServiceClient.Update.Result {
        const { transaction, realm, patch, id } = props;
        const entity = await this.serviceClientRepository.findUniqueOrThrow({
            where: { id, application: { realm } },
            transaction,
        });

        entity.update(patch);
    }

    public async revoke(props: Services.ServiceClient.Revoke.Props): Services.ServiceClient.Revoke.Result {
        const { transaction, identifiers, realm } = props;
        const entities = await this.serviceClientRepository.find({
            where: { id: { $in: identifiers }, application: { realm } },
            options: { populate: ["application"] },
            transaction,
        });

        if (entities.length < identifiers.length) {
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
        const entities = await this.serviceClientRepository.find({
            where: { id: { $in: identifiers }, application: { realm } },
            options: { populate: ["application"] },
            transaction,
        });

        if (entities.length < identifiers.length) {
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
        const entities = await this.serviceClientRepository.find({
            where: { id: { $in: identifiers }, application: { realm } },
            options: { populate: ["application"] },
            transaction,
        });

        if (entities.length < identifiers.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.CLIENTS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.canPurge();
                transaction.remove(entity);
            }

            return entities;
        }
    }
}
