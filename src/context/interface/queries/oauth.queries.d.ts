import { CodeChallengeMethod, OAuthResponseType, TokenGrantType, OidcScope } from "~context/enums";

declare global {
    namespace Queries {
        namespace OAuth {
            interface ControllerContract {
                getAuthorizationServerMetadata(): AuthorizationServerMetadata.Result;
                getOpenIdConfiguration(): OpenIdConfiguration.Result;
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

            namespace OpenIdConfiguration {
                type Result = AuthorizationServerMetadata.Result & {
                    idTokenSigningAlgValuesSupported: ["ES256"];
                    subjectTypesSupported: ["public"];
                    scopesSupported: OidcScope[];
                    claimsSupported: string[];
                    userinfoEndpoint: string;
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
