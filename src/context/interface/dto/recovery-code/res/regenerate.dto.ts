import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { SuccessMessageDTO } from "~common/dto";
import { Validator } from "~common/validator";

@ApiSchema({ name: "RecoveryCodesRegenerateResult" })
export class RegenerateResultDTO extends SuccessMessageDTO {
    @Expose()
    @Validator.IsArray()
    @Validator.IsString({ each: true })
    @ApiProperty({ required: true, type: String })
    declare public codes: string[];
}
