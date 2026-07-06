import { ApiProperty, ApiSchema } from "@nestjs/swagger";

import { CodeChallengeMethod, OAuthResponseType, TokenGrantType } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "AuthzServerMetadata" })
export class AuthzServerMetadataDTO {
    @Validator.ExposeAs("issuer")
    @Validator.IsString()
    @ApiProperty({ type: String })
    declare public issuer: string;

    @Validator.ExposeAs("authorization_endpoint")
    @Validator.IsString()
    @ApiProperty({ type: String })
    declare public authorizationEndpoint: string;

    @Validator.ExposeAs("token_endpoint")
    @Validator.IsString()
    @ApiProperty({ type: String })
    declare public tokenEndpoint: string;

    @Validator.ExposeAs("jwks_uri")
    @Validator.IsString()
    @ApiProperty({ type: String })
    declare public jwksURI: string;

    @Validator.ExposeAs("response_types_supported")
    @Validator.IsArray()
    @ApiProperty({ type: [String], enum: OAuthResponseType })
    declare public responseTypesSupported: OAuthResponseType[];

    @Validator.ExposeAs("grant_types_supported")
    @Validator.IsArray()
    @ApiProperty({ type: [String], enum: TokenGrantType })
    declare public grantTypesSupported: TokenGrantType[];

    @Validator.ExposeAs("code_challenge_methods_supported")
    @Validator.IsArray()
    @ApiProperty({ type: [String], enum: CodeChallengeMethod })
    declare public codeChallengeMethodsSupported: CodeChallengeMethod[];

    @Validator.ExposeAs("token_endpoint_auth_methods_supported")
    @Validator.IsArray()
    @ApiProperty({ type: [String], enum: ["none"] })
    declare public tokenEndpointAuthMethodsSupported: ["none"];
}
