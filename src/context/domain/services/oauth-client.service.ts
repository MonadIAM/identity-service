import { Inject, Injectable, Scope } from "@nestjs/common";

import { OAUTH_CLIENT_REPOSITORY } from "~context/infrastructure/repositories";
import { OAuthClient } from "~context/domain/entities";
import { TokenGrantType } from "~context/enums";
import { Exception } from "~common/exceptions";

@Injectable({ scope: Scope.DEFAULT })
export class OAuthClientService implements Services.OAuthClient.Contract {
    private readonly dictionaryPath = "services.oauth-client";
    private readonly grantTypes: TokenGrantType[] = [TokenGrantType.AUTHORIZATION_CODE, TokenGrantType.REFRESH_TOKEN];

    public constructor(
        @Inject(OAUTH_CLIENT_REPOSITORY)
        private readonly oauthClientRepository: Repositories.OAuthClient.Contract,
    ) {}

    public async create(props: Services.OAuthClient.Create.Props): Services.OAuthClient.Create.Result {
        const { transaction, input } = props;

        this.validateRedirectUri(input.redirectUri);

        const limitExceeded = await this.oauthClientRepository.wouldExceedRealmLimit({
            realm: input.realm,
            transaction,
        });

        if (limitExceeded) {
            throw Exception.invariantViolation({ messageKey: `${this.dictionaryPath}.REALM_LIMIT_EXCEEDED` });
        }

        const entity = new OAuthClient({ ...input, grantTypes: [...this.grantTypes] });
        transaction.persist(entity);

        return entity;
    }

    public update(props: Services.OAuthClient.Update.Props): Services.OAuthClient.Update.Result {
        const { entity, patch } = props;

        if (patch.redirectUri !== undefined) {
            this.validateRedirectUri(patch.redirectUri);
        }

        entity.update(patch);
    }

    public revoke(props: Services.OAuthClient.Revoke.Props): Services.OAuthClient.Revoke.Result {
        for (const entity of props.entities) {
            entity.revoke();
        }
    }

    public restore(props: Services.OAuthClient.Restore.Props): Services.OAuthClient.Restore.Result {
        for (const entity of props.entities) {
            entity.restore();
        }
    }

    public purge(props: Services.OAuthClient.Purge.Props): Services.OAuthClient.Purge.Result {
        for (const entity of props.entities) {
            entity.canPurge();
            props.transaction.remove(entity);
        }
    }

    public applyRealmRevocation(
        props: Services.OAuthClient.ApplyRealmRevocation.Props,
    ): Services.OAuthClient.ApplyRealmRevocation.Result {
        for (const entity of props.entities) {
            entity.applyRealmRevocation(props.version);
        }
    }

    public applyRealmRestore(
        props: Services.OAuthClient.ApplyRealmRestore.Props,
    ): Services.OAuthClient.ApplyRealmRestore.Result {
        for (const entity of props.entities) {
            entity.applyRealmRestore(props.version);
        }
    }

    public purgeRealm(props: Services.OAuthClient.PurgeRealm.Props): Services.OAuthClient.PurgeRealm.Result {
        for (const entity of props.entities) {
            if (props.version > entity.realmVersion) {
                props.transaction.remove(entity);
            }
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
