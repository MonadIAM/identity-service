import { CodeChallengeMethod, OAuthResponseType, TokenGrantType, OidcScope } from "~context/enums";

declare global {
    namespace Queries {
        namespace OAuth {
            interface Contract extends ControllerContract {}

            interface ControllerContract {
                getAuthorizationServerMetadata: AuthorizationServerMetadata.Signature;
                getOpenIdConfiguration: OpenIdConfiguration.Signature;
                getUserInfo: UserInfo.Signature;
            }

            namespace AuthorizationServerMetadata {
                type Result = {
                    tokenEndpointAuthMethodsSupported: ["none"];
                    codeChallengeMethodsSupported: CodeChallengeMethod[];
                    responseTypesSupported: OAuthResponseType[];
                    grantTypesSupported: TokenGrantType[];
                    scopesSupported: OidcScope[];
                    authorizationEndpoint: string;
                    revocationEndpoint: string;
                    tokenEndpoint: string;
                    jwksURI: string;
                    issuer: string;
                };

                type Signature = () => Result;
            }

            namespace OpenIdConfiguration {
                type Result = AuthorizationServerMetadata.Result & {
                    idTokenSigningAlgValuesSupported: ["ES256"];
                    subjectTypesSupported: ["pairwise"];
                    endSessionEndpoint: string;
                    claimsSupported: string[];
                    userinfoEndpoint: string;
                };

                type Signature = () => Result;
            }

            namespace UserInfo {
                type Props = {
                    account: string;
                    client: string;
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

                type Signature = (props: Props) => Result;
            }
        }
    }
}
