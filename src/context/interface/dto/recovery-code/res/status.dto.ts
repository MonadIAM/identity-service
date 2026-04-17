import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "RecoveryCodesStatusResult" })
export class StatusResultDTO {
    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    declare public remaining: number;

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    declare public total: number;

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    declare public used: number;
}
