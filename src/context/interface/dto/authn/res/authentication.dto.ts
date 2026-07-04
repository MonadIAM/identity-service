import { ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { SuccessMessageDTO } from "~common/dto";
import { Validator } from "~common/validator";

@ApiSchema({ name: "AuthnAuthenticationResult" })
export class AuthenticationResultDTO extends SuccessMessageDTO {
    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public authorizationUrl?: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsBoolean()
    @ApiPropertyOptional({ type: Boolean })
    declare public requires2FA?: boolean;
}
