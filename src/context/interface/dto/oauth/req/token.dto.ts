import { ApiProperty, ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import { ValidateIf } from "class-validator";
import { Expose } from "class-transformer";

import { TokenGrantType } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "OAuthTokenBody" })
export class TokenBodyDTO {
    @Expose()
    @Validator.IsEnum(TokenGrantType)
    @ApiProperty({ required: true, enum: TokenGrantType })
    declare public grantType: TokenGrantType;

    @Expose()
    @Validator.IsUUID("4")
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public client: string;

    @Expose()
    @ValidateIf(({ grantType }) => grantType === TokenGrantType.AUTHORIZATION_CODE)
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public code: string;

    @Expose()
    @ValidateIf(({ grantType }) => grantType === TokenGrantType.AUTHORIZATION_CODE)
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public redirectUri: string;

    @Expose()
    @ValidateIf(({ grantType }) => grantType === TokenGrantType.AUTHORIZATION_CODE)
    @Validator.IsString()
    @Validator.Length(43, 128)
    @Validator.IsMatches(/^[A-Za-z0-9\-._~]+$/)
    @ApiPropertyOptional({ type: String })
    declare public codeVerifier: string;
}
