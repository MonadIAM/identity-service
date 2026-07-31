import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "SecondFactorCreateBody" })
export class CreateBodyDTO {
    @Expose()
    @Validator.IsString()
    @Validator.MaxLength(128)
    @ApiProperty({ required: true, type: String })
    declare public name: string;
}
