import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class ChangeBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public currentPassword!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public newPassword!: string;
}
