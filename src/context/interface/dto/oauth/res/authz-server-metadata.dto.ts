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

    @Expose()
    @Validator.IsString()
    @ApiProperty({ type: String })
    declare public authorizationEndpoint: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ type: String })
    declare public tokenEndpoint: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ type: String })
    declare public jwksURI: string;

    @Expose()
    @Validator.IsArray()
    @ApiProperty({ type: [String], enum: OAuthResponseType })
    declare public responseTypesSupported: OAuthResponseType[];

    @Expose()
    @Validator.IsArray()
    @ApiProperty({ type: [String], enum: TokenGrantType })
    declare public grantTypesSupported: TokenGrantType[];

    @Expose()
    @Validator.IsArray()
    @ApiProperty({ type: [String], enum: CodeChallengeMethod })
    declare public codeChallengeMethodsSupported: CodeChallengeMethod[];

    @Expose()
    @Validator.IsArray()
    @ApiProperty({ type: [String], enum: ["none"] })
    declare public tokenEndpointAuthMethodsSupported: ["none"];
}
