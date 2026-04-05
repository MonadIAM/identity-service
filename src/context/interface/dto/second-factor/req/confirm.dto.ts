import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class ConfirmBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public factor!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public code!: string;
}
