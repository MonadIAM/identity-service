import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class ResetBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public identifier!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public code!: string;
}
