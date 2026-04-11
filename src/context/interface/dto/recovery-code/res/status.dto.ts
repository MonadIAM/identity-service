import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class StatusResultDTO {
    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    public remaining!: number;

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    public total!: number;

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    public used!: number;
}
