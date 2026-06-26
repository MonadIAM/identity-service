import { CodeChallengeMethod, OAuthResponseType, TokenGrantType } from "~context/enums";

declare global {
    namespace Queries {
        namespace OAuth {
            interface ControllerContract {
                getAuthorizationServerMetadata(): AuthorizationServerMetadata.Result;
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
        }
    }
}
