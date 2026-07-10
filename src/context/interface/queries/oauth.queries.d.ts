import { CodeChallengeMethod, OAuthResponseType, TokenGrantType } from "~context/enums";

declare global {
    namespace Queries {
        namespace OAuth {
            interface ControllerContract {
                getAuthorizationServerMetadata(): AuthorizationServerMetadata.Result;
                getUserInfo(props: UserInfo.Props): UserInfo.Result;
            }

            interface Contract extends ControllerContract {}

            namespace AuthorizationServerMetadata {
                type Result = {
                    tokenEndpointAuthMethodsSupported: ["none"];
                    codeChallengeMethodsSupported: CodeChallengeMethod[];
                    responseTypesSupported: OAuthResponseType[];
                    grantTypesSupported: TokenGrantType[];
                    authorizationEndpoint: string;
                    tokenEndpoint: string;
                    jwksURI: string;
                    issuer: string;
                };
            }

            namespace UserInfo {
                type Props = {
                    account: string;
                    scope: string;
                };

                type Result = Promise<{
                    sub: string;
                    name?: string;
                    picture?: string;
                    zoneinfo?: string;
                    locale?: string;
                    updatedAt?: number;
                    email?: string;
                    emailVerified?: boolean;
                }>;
            }
        }
    }
}
