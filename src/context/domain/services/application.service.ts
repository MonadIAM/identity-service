import { Inject, Injectable, Scope } from "@nestjs/common";

import { Exception } from "~common/exceptions";

import { APPLICATION_REPOSITORY } from "../repositories";
import { Application } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class ApplicationService implements Services.Application.Contract {
    private readonly dictionaryPath = "services.application";

    public constructor(
        @Inject(APPLICATION_REPOSITORY)
        private readonly applicationRepository: Repositories.Application.Contract,
    ) {}

    public async create(props: Services.Application.Create.Props): Services.Application.Create.Result {
        const { transaction, input } = props;

        const limitExceeded = await this.applicationRepository.wouldExceedRealmLimit({
            realm: input.realm,
            transaction,
        });

        if (limitExceeded) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.REALM_LIMIT_EXCEEDED` });
        }

        const entity = new Application({ ...input });
        transaction.persist(entity);

        return entity;
    }

    public update(props: Services.Application.Update.Props): Services.Application.Update.Result {
        props.entity.update(props.patch);
    }

    public revoke(props: Services.Application.Revoke.Props): Services.Application.Revoke.Result {
        for (const entity of props.entities) {
            entity.revoke();
        }

        this.cascadeRevokeChildren(props.entities);
    }

    public restore(props: Services.Application.Restore.Props): Services.Application.Restore.Result {
        for (const entity of props.entities) {
            entity.restore();
        }

        this.cascadeRestoreChildren(props.entities);
    }

    public purge(props: Services.Application.Purge.Props): Services.Application.Purge.Result {
        for (const entity of props.entities) {
            entity.canPurge();
            props.transaction.remove(entity);
        }
    }

    public applyRealmRevocation(
        props: Services.Application.ApplyRealmRevocation.Props,
    ): Services.Application.ApplyRealmRevocation.Result {
        for (const entity of props.entities) {
            entity.applyRealmRevocation(props.version);
        }

        this.cascadeRevokeChildren(props.entities);
    }

    public applyRealmRestore(
        props: Services.Application.ApplyRealmRestore.Props,
    ): Services.Application.ApplyRealmRestore.Result {
        for (const entity of props.entities) {
            entity.applyRealmRestore(props.version);
        }

        this.cascadeRestoreChildren(props.entities);
    }

    public purgeRealm(props: Services.Application.PurgeRealm.Props): Services.Application.PurgeRealm.Result {
        for (const entity of props.entities) {
            if (props.version > entity.realmVersion && !entity.isSystemManaged) {
                props.transaction.remove(entity);
            }
        }
    }

    private cascadeRevokeChildren(entities: Entities.Application[]): void {
        for (const application of entities) {
            for (const client of application.interfaceClients) {
                client.applyApplicationRevocation(application.version);
            }

            for (const client of application.serviceClients) {
                client.applyApplicationRevocation(application.version);
            }
        }
    }

    private cascadeRestoreChildren(entities: Entities.Application[]): void {
        for (const application of entities) {
            for (const client of application.interfaceClients) {
                client.applyApplicationRestore(application.version);
            }

            for (const client of application.serviceClients) {
                client.applyApplicationRestore(application.version);
            }
        }
    }
}
