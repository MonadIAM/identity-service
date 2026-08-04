import { Inject, Injectable, Scope } from "@nestjs/common";

import { Exception } from "~common/exceptions";

import { SERVICE_CLIENT_REPOSITORY } from "../repositories";
import { ServiceClient } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class ServiceClientService implements Services.ServiceClient.Contract {
    private readonly dictionaryPath = "services.service-client";

    public constructor(
        @Inject(SERVICE_CLIENT_REPOSITORY)
        private readonly serviceClientRepository: Repositories.ServiceClient.PublicContract,
    ) {}

    public async create(props: Services.ServiceClient.Create.Props): Services.ServiceClient.Create.Result {
        const { transaction, input } = props;

        const limitExceeded = await this.serviceClientRepository.wouldExceedApplicationLimit({
            application: input.application.id,
            transaction,
        });

        if (limitExceeded) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.APPLICATION_LIMIT_EXCEEDED` });
        }

        const entity = new ServiceClient({ ...input });
        transaction.persist(entity);

        return entity;
    }

    public update(props: Services.ServiceClient.Update.Props): Services.ServiceClient.Update.Result {
        props.entity.update(props.patch);
    }

    public revoke(props: Services.ServiceClient.Revoke.Props): Services.ServiceClient.Revoke.Result {
        for (const entity of props.entities) {
            entity.revoke();
        }
    }

    public restore(props: Services.ServiceClient.Restore.Props): Services.ServiceClient.Restore.Result {
        for (const entity of props.entities) {
            entity.restore();
        }
    }

    public purge(props: Services.ServiceClient.Purge.Props): Services.ServiceClient.Purge.Result {
        for (const entity of props.entities) {
            entity.canPurge();
            props.transaction.remove(entity);
        }
    }

    public applyApplicationRevocation(
        props: Services.ServiceClient.ApplyApplicationRevocation.Props,
    ): Services.ServiceClient.ApplyApplicationRevocation.Result {
        for (const entity of props.entities) {
            entity.applyApplicationRevocation(props.version);
        }
    }

    public applyApplicationRestore(
        props: Services.ServiceClient.ApplyApplicationRestore.Props,
    ): Services.ServiceClient.ApplyApplicationRestore.Result {
        for (const entity of props.entities) {
            entity.applyApplicationRestore(props.version);
        }
    }
}
