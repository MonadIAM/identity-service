import { ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { SuccessMessageDTO } from "~common/dto";
import { Validator } from "~common/validator";

@ApiSchema({ name: "AuthnInternalTokenResult" })
export class InternalTokenResultDTO extends SuccessMessageDTO {
    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public accessToken?: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public tokenType?: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsPositiveInt()
    @ApiPropertyOptional({ type: Number })
    declare public expiresIn?: number;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsBoolean()
    @ApiPropertyOptional({ type: Boolean })
    declare public requires2FA?: boolean;
}
