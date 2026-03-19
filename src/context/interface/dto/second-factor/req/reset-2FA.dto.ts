import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class ResetByMasterCodeBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public identifier!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public masterCode!: string;
}
