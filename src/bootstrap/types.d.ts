import { OAuthFlowObject, SecuritySchemeObject } from "@nestjs/swagger";

declare global {
    namespace Bootstrap {
        namespace Reference {
            type PkceMode = "SHA-256" | "plain" | "no";

            type Source = {
                default?: boolean;
                content?: object;
                title: string;
                slug: string;
                url?: string;
            };

            type OAuthFlow = OAuthFlowObject & {
                "x-scalar-client-id": string;
                "x-usePkce": PkceMode;
            };

            type SecurityScheme = SecuritySchemeObject & {
                "x-default-scopes": string[];
                flows: { authorizationCode: OAuthFlow };
            };

            namespace Automation {
                type FetchCallback = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

                type JsonObject = UnknownObject;

                type Configuration = {
                    customFetch: FetchCallback;
                };
            }
        }
    }
}
