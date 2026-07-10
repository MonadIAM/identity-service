import { ApiPropertyOptional, ApiProperty, ApiSchema } from "@nestjs/swagger";

import { Validator } from "~common/validator";

@ApiSchema({ name: "OAuthUserInfo" })
export class UserInfoResultDTO {
    @Validator.ExposeAs("sub")
    @Validator.IsString()
    @ApiProperty({ type: String })
    declare public sub: string;

    @Validator.ExposeAs("name")
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public name?: string;

    @Validator.ExposeAs("picture")
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public picture?: string;

    @Validator.ExposeAs("zoneinfo")
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public zoneinfo?: string;

    @Validator.ExposeAs("locale")
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public locale?: string;

    @Validator.ExposeAs("updated_at")
    @Validator.IsOptional()
    @Validator.IsPositiveInt()
    @ApiPropertyOptional({ type: Number })
    declare public updatedAt?: number;

    @Validator.ExposeAs("email")
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public email?: string;

    @Validator.ExposeAs("email_verified")
    @Validator.IsOptional()
    @Validator.IsBoolean()
    @ApiPropertyOptional({ type: Boolean })
    declare public emailVerified?: boolean;
}
