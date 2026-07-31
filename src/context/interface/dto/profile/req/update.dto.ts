import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "ProfileUpdateBody" })
export class UpdateBodyDTO {
    @Expose()
    @Validator.IsString()
    @Validator.MaxLength(128)
    @ApiProperty({ required: true, type: String })
    declare public displayName: string;

    @Expose()
    @Validator.IsString()
    @Validator.MaxLength(64)
    @ApiProperty({ required: true, type: String })
    declare public timeZone: string;

    @Expose()
    @Validator.IsString()
    @Validator.MaxLength(16)
    @ApiProperty({ required: true, type: String })
    declare public locale: string;
}
