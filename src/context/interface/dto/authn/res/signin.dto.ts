import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { SuccessMessageDTO } from "~common/dto";
import { Validator } from "~common/validator";

@ApiSchema({ name: "AuthnSigninResult" })
export class SigninResultDTO extends SuccessMessageDTO {
    @Expose()
    @Validator.IsString()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String })
    public accessToken?: string;

    @Expose()
    @Validator.IsBoolean()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: Boolean })
    public requires2FA?: string;
}
