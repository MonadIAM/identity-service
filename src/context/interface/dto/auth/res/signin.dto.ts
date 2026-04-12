import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { SuccessMessageDTO } from "~common/dto";
import { Validator } from "~common/validator";

@ApiSchema({ name: "AuthSigninResult" })
export class SigninResultDTO extends SuccessMessageDTO {
    @Expose()
    @Validator.IsBoolean()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: Boolean })
    public requires2FA?: string;
}
