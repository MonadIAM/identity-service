import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class PurgeBodyDTO {
    @Expose()
    @Validator.IsArray()
    @Validator.IsString({ each: true })
    @ApiProperty({ required: true, type: [String] })
    public sessions!: string[];
}
