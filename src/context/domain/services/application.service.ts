import { Inject, Injectable, Scope } from "@nestjs/common";

import { APPLICATION_REPOSITORY } from "~context/infrastructure/repositories";
import { Exception } from "~common/exceptions";

import { Application } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class ApplicationService implements Services.Application.Contract {
    private readonly dictionaryPath = "services.application";

    public constructor(
        @Inject(APPLICATION_REPOSITORY)
        private readonly applicationRepository: Repositories.Application.PublicContract,
    ) {}

    public async create(props: Services.Application.Create.Props): Services.Application.Create.Result {
        const { transaction, input } = props;

        const limitExceeded = await this.applicationRepository.wouldExceedRealmLimit({
            realm: input.realm,
            transaction,
        });

        if (limitExceeded) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.REALM_LIMIT_EXCEEDED` });
        } else {
            const entity = new Application({ ...input });
            transaction.persist(entity);
            return entity;
        }
    }

    public async update(props: Services.Application.Update.Props): Services.Application.Update.Result {
        const { transaction, realm, patch, id } = props;
        const entity = await this.applicationRepository.findUniqueOrThrow({
            where: { id, realm },
            transaction,
        });

        entity.update(patch);
    }

    public async revoke(props: Services.Application.Revoke.Props): Services.Application.Revoke.Result {
        const { transaction, identifiers, realm } = props;
        const entities = await this.applicationRepository.find({
            options: { populate: ["interfaceClients", "serviceClients"] },
            where: { id: { $in: identifiers }, realm },
            transaction,
        });

        if (entities.length < identifiers.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.APPLICATIONS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.revoke();
            }

            this.cascadeRevocation({ entities });

            return entities;
        }
    }

    public async restore(props: Services.Application.Restore.Props): Services.Application.Restore.Result {
        const { transaction, identifiers, realm } = props;
        const entities = await this.applicationRepository.find({
            options: { populate: ["interfaceClients", "serviceClients"] },
            where: { id: { $in: identifiers }, realm },
            transaction,
        });

        if (entities.length < identifiers.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.APPLICATIONS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.restore();
            }

            this.cascadeRestore({ entities });

            return entities;
        }
    }

    public async applyRealmRevocation(
        props: Services.Application.ApplyRealmRevocation.Props,
    ): Services.Application.ApplyRealmRevocation.Result {
        const { transaction, version, realm } = props;
        const entities = await this.applicationRepository.find({
            options: { populate: ["interfaceClients", "serviceClients"] },
            where: { realm },
            transaction,
        });

        for (const entity of entities) {
            entity.applyRealmRevocation(version);
        }

        this.cascadeRevocation({ entities });

        return entities;
    }

    public async applyRealmRestore(
        props: Services.Application.ApplyRealmRestore.Props,
    ): Services.Application.ApplyRealmRestore.Result {
        const { transaction, version, realm } = props;
        const entities = await this.applicationRepository.find({
            options: { populate: ["interfaceClients", "serviceClients"] },
            where: { realm },
            transaction,
        });

        for (const entity of entities) {
            entity.applyRealmRestore(version);
        }

        this.cascadeRestore({ entities });

        return entities;
    }

    public async purge(props: Services.Application.Purge.Props): Services.Application.Purge.Result {
        const { transaction, identifiers, realm } = props;
        const entities = await this.applicationRepository.find({
            where: { id: { $in: identifiers }, realm },
            transaction,
        });

        if (entities.length < identifiers.length) {
            throw Exception.notFound({ messageKey: `${this.dictionaryPath}.APPLICATIONS_NOT_FOUND` });
        } else {
            for (const entity of entities) {
                entity.canPurge();
                transaction.remove(entity);
            }

            return entities;
        }
    }

    public async purgeRealm(props: Services.Application.PurgeRealm.Props): Services.Application.PurgeRealm.Result {
        const { transaction, version, realm } = props;
        const entities = await this.applicationRepository.find({ transaction, where: { realm } });

        for (const entity of entities) {
            if (version > entity.realmVersion && !entity.isSystemManaged) {
                transaction.remove(entity);
            }
        }
    }

    public cascadeRevocation(
        props: Services.Application.CascadeRevocation.Props,
    ): Services.Application.CascadeRevocation.Result {
        for (const application of props.entities) {
            for (const client of application.interfaceClients) {
                client.applyApplicationRevocation(application.version);
            }

            for (const client of application.serviceClients) {
                client.applyApplicationRevocation(application.version);
            }
        }
    }

    public cascadeRestore(props: Services.Application.CascadeRestore.Props): Services.Application.CascadeRestore.Result {
        for (const application of props.entities) {
            for (const client of application.interfaceClients) {
                client.applyApplicationRestore(application.version);
            }

            for (const client of application.serviceClients) {
                client.applyApplicationRestore(application.version);
            }
        }
    }
}
