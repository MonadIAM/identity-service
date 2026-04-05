import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class UpdateBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public displayName!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public timeZone!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public locale!: string;
}
