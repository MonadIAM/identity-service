import { ApiProperty, ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import { ValidateIf } from "class-validator";
import { Expose } from "class-transformer";

import { TokenGrantType } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "OAuthTokenBody" })
export class TokenBodyDTO {
    @Expose({ name: "grant_type" })
    @Validator.IsString()
    @ApiProperty({ required: true, enum: TokenGrantType, name: "grant_type" })
    declare public grantType: TokenGrantType;

    @Expose({ name: "client_id" })
    @Validator.IsString()
    @ApiProperty({ required: true, type: String, name: "client_id" })
    declare public client: string;

    @Expose({ name: "refresh_token" })
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String, name: "refresh_token" })
    declare public refreshToken?: string;

    @Expose()
    @ValidateIf(({ grantType }) => grantType === TokenGrantType.AUTHORIZATION_CODE)
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public code?: string;

    @Expose({ name: "redirect_uri" })
    @ValidateIf(({ grantType }) => grantType === TokenGrantType.AUTHORIZATION_CODE)
    @Validator.IsString()
    @ApiPropertyOptional({ type: String, name: "redirect_uri" })
    declare public redirectUri?: string;

    @Expose({ name: "code_verifier" })
    @ValidateIf(({ grantType }) => grantType === TokenGrantType.AUTHORIZATION_CODE)
    @Validator.IsString()
    @Validator.Length(43, 128)
    @Validator.IsMatches(/^[A-Za-z0-9\-._~]+$/)
    @ApiPropertyOptional({ type: String, name: "code_verifier" })
    declare public codeVerifier?: string;
}
