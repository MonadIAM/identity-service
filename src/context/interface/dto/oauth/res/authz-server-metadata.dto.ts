import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { CodeChallengeMethod, OAuthResponseType, TokenGrantType } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "AuthzServerMetadata" })
export class AuthzServerMetadataDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ type: String })
    declare public issuer: string;

    @Expose({ name: "authorizationEndpoint" })
    @Validator.IsString()
    @ApiProperty({ type: String, name: "authorization_endpoint" })
    declare public authorization_endpoint: string;

    @Expose({ name: "tokenEndpoint" })
    @Validator.IsString()
    @ApiProperty({ type: String, name: "token_endpoint" })
    declare public token_endpoint: string;

    @Expose({ name: "jwksUri" })
    @Validator.IsString()
    @ApiProperty({ type: String, name: "jwks_uri" })
    declare public jwks_uri: string;

    @Expose({ name: "responseTypesSupported" })
    @Validator.IsArray()
    @ApiProperty({ type: [String], enum: OAuthResponseType, name: "response_types_supported" })
    declare public response_types_supported: OAuthResponseType[];

    @Expose({ name: "grantTypesSupported" })
    @Validator.IsArray()
    @ApiProperty({ type: [String], enum: TokenGrantType, name: "grant_types_supported" })
    declare public grant_types_supported: TokenGrantType[];

    @Expose({ name: "codeChallengeMethodsSupported" })
    @Validator.IsArray()
    @ApiProperty({ type: [String], enum: CodeChallengeMethod, name: "code_challenge_methods_supported" })
    declare public code_challenge_methods_supported: CodeChallengeMethod[];

    @Expose({ name: "tokenEndpointAuthMethodsSupported" })
    @Validator.IsArray()
    @ApiProperty({ type: [String], enum: ["none"], name: "token_endpoint_auth_methods_supported" })
    declare public token_endpoint_auth_methods_supported: ["none"];
}
