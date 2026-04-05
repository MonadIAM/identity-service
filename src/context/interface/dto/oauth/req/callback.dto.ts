import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class CallbackBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public provider!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public state!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public code!: string;
}
