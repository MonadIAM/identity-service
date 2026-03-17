import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { SuccessMessageDTO } from "~common/dto";
import { Validator } from "~common/validator";

export class AccountConfirmationDTO extends SuccessMessageDTO {
    @Expose()
    @Validator.IsListOrSingleString()
    @ApiProperty({ required: true, type: [String] })
    public recoveryCodes!: string[];
}
