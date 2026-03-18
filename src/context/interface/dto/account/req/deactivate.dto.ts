import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class DeactivateAccountBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public password!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public account!: string;
}
