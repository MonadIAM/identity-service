import { ApiProperty, ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import { ValidateIf } from "class-validator";
import { Expose } from "class-transformer";

import { TokenGrantType } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "OAuthTokenBody" })
export class TokenBodyDTO {
    @Expose()
    @Validator.FromAlias("grant_type", "grantType")
    @Validator.IsEnum(TokenGrantType)
    @ApiProperty({
        required: true,
        enum: TokenGrantType,
        name: "grant_type",
        description: "Also accepted as `grantType` for backward compatibility.",
    })
    declare public grantType: TokenGrantType;

    @Expose()
    @Validator.FromAlias("client_id", "client")
    @Validator.IsUUID("4")
    @ApiProperty({
        required: true,
        type: String,
        format: "uuid",
        name: "client_id",
        description: "Also accepted as `client` for backward compatibility.",
    })
    declare public client: string;

    @Expose()
    @ValidateIf(({ grantType }) => grantType === TokenGrantType.AUTHORIZATION_CODE)
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public code: string;

    @Expose()
    @Validator.FromAlias("redirect_uri", "redirectUri")
    @ValidateIf(({ grantType }) => grantType === TokenGrantType.AUTHORIZATION_CODE)
    @Validator.IsString()
    @ApiPropertyOptional({
        type: String,
        name: "redirect_uri",
        description: "Also accepted as `redirectUri` for backward compatibility.",
    })
    declare public redirectUri: string;

    @Expose()
    @Validator.FromAlias("code_verifier", "codeVerifier")
    @ValidateIf(({ grantType }) => grantType === TokenGrantType.AUTHORIZATION_CODE)
    @Validator.IsString()
    @Validator.Length(43, 128)
    @Validator.IsMatches(/^[A-Za-z0-9\-._~]+$/)
    @ApiPropertyOptional({
        type: String,
        name: "code_verifier",
        description: "Also accepted as `codeVerifier` for backward compatibility.",
    })
    declare public codeVerifier: string;

    @Expose()
    @Validator.FromAlias("refresh_token", "refreshToken")
    @ValidateIf(({ grantType }) => grantType === TokenGrantType.REFRESH_TOKEN)
    @Validator.IsString()
    @ApiPropertyOptional({
        type: String,
        name: "refresh_token",
        description: "Also accepted as `refreshToken` for backward compatibility.",
    })
    declare public refreshToken?: string;
}
