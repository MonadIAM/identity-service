import { Inject, Injectable, Scope } from "@nestjs/common";

import { INTERFACE_CLIENT_REPOSITORY } from "~context/infrastructure/repositories";
import { InterfaceClient } from "~context/domain/entities";
import { TokenGrantType } from "~context/enums";
import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class InterfaceClientService implements Services.InterfaceClient.Contract {
    private readonly dictionaryPath = "services.interface-client";
    private readonly grantTypes: TokenGrantType[] = [TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN];

    public constructor(
        @Inject(INTERFACE_CLIENT_REPOSITORY)
        private readonly interfaceClientRepository: Repositories.InterfaceClient.Contract,
    ) {}

    public async create(props: Services.InterfaceClient.Create.Props): Services.InterfaceClient.Create.Result {
        const { transaction, input } = props;

        this.validateRedirectUri(input.redirectUri);
        this.validateRedirectUri(input.authAddress);

        const limitExceeded = await this.interfaceClientRepository.wouldExceedApplicationLimit({
            application: input.application.id,
            transaction,
        });

        if (limitExceeded) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.APPLICATION_LIMIT_EXCEEDED` });
        }

        const entity = new InterfaceClient({ ...input, grantTypes: [...this.grantTypes] });
        transaction.persist(entity);

        return entity;
    }

    public update(props: Services.InterfaceClient.Update.Props): Services.InterfaceClient.Update.Result {
        const { entity, patch } = props;

        if (patch.redirectUri !== undefined) {
            this.validateRedirectUri(patch.redirectUri);
        }

        if (patch.authAddress) {
            this.validateRedirectUri(patch.authAddress);
        }

        entity.update(patch);
    }

    public revoke(props: Services.InterfaceClient.Revoke.Props): Services.InterfaceClient.Revoke.Result {
        for (const entity of props.entities) {
            entity.revoke();
        }
    }

    public restore(props: Services.InterfaceClient.Restore.Props): Services.InterfaceClient.Restore.Result {
        for (const entity of props.entities) {
            entity.restore();
        }
    }

    public purge(props: Services.InterfaceClient.Purge.Props): Services.InterfaceClient.Purge.Result {
        for (const entity of props.entities) {
            entity.canPurge();
            props.transaction.remove(entity);
        }
    }

    public applyApplicationRevocation(
        props: Services.InterfaceClient.ApplyApplicationRevocation.Props,
    ): Services.InterfaceClient.ApplyApplicationRevocation.Result {
        for (const entity of props.entities) {
            entity.applyApplicationRevocation(props.version);
        }
    }

    public applyApplicationRestore(
        props: Services.InterfaceClient.ApplyApplicationRestore.Props,
    ): Services.InterfaceClient.ApplyApplicationRestore.Result {
        for (const entity of props.entities) {
            entity.applyApplicationRestore(props.version);
        }
    }

    private validateRedirectUri(redirectUri: string): void {
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
}
