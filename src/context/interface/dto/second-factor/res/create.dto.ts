import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { SuccessMessageDTO } from "~common/dto";
import { Validator } from "~common/validator";

@ApiSchema({ name: "SecondFactorCreateResult" })
export class CreateResultDTO extends SuccessMessageDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public uri!: string;
}
