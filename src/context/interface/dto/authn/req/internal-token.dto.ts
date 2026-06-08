import { ApiProperty, ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import { ValidateIf } from "class-validator";
import { Expose } from "class-transformer";

import { TokenGrantType } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "AuthnInternalTokenBody" })
export class InternalTokenBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, enum: TokenGrantType })
    declare public grantType: TokenGrantType;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public client: string;

    @Expose()
    @ValidateIf(({ grantType }) => grantType === TokenGrantType.PASSWORD)
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public identifier?: string;

    @Expose()
    @ValidateIf(({ grantType }) => grantType === TokenGrantType.PASSWORD)
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public password?: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public refreshToken?: string;
}
