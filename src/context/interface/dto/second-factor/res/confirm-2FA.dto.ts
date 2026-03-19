import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { SuccessMessageDTO } from "~common/dto";
import { Validator } from "~common/validator";

export class ConfirmSecondFactorDTO extends SuccessMessageDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public masterCode!: string;
}
