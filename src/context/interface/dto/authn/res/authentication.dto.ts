import { ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { SuccessMessageDTO } from "~common/dto";
import { Validator } from "~common/validator";

@ApiSchema({ name: "AuthnAuthenticationResult" })
export class AuthenticationResultDTO extends SuccessMessageDTO {
    @Expose({ name: "authorizationUrl" })
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String, name: "authorization_url" })
    declare public authorization_url?: string;

    @Expose({ name: "requires2FA" })
    @Validator.IsOptional()
    @Validator.IsBoolean()
    @ApiPropertyOptional({ type: Boolean, name: "requires_2fa" })
    declare public requires_2fa?: boolean;
}
