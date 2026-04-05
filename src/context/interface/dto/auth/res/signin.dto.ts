import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { SuccessMessageDTO } from "~common/dto";
import { Validator } from "~common/validator";

export class SigninResultDTO extends SuccessMessageDTO {
    @Expose()
    @Validator.IsBoolean()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: Boolean })
    public requires2FA?: string;
}
