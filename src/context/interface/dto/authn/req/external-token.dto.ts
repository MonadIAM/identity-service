import { ApiProperty, ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import { ValidateIf } from "class-validator";
import { Expose } from "class-transformer";

import { TokenGrantType } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "AuthnExternalTokenBody" })
export class ExternalTokenBodyDTO {
    @Expose({ name: "grant_type" })
    @Validator.IsString()
    @ApiProperty({ required: true, enum: TokenGrantType, name: "grant_type" })
    declare public grantType: TokenGrantType;

    @Expose({ name: "client_id" })
    @Validator.IsString()
    @ApiProperty({ required: true, type: String, name: "client_id" })
    declare public client: string;

    @Expose({ name: "username" })
    @ValidateIf(({ grantType }) => grantType === TokenGrantType.PASSWORD)
    @Validator.IsString()
    @ApiPropertyOptional({ type: String, name: "username" })
    declare public identifier?: string;

    @Expose()
    @ValidateIf(({ grantType }) => grantType === TokenGrantType.PASSWORD)
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public password?: string;

    @Expose({ name: "refresh_token" })
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String, name: "refresh_token" })
    declare public refreshToken?: string;
}
