import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "Profile" })
export class ProfileDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public displayName: string;

    @Expose()
    @ApiProperty({ required: false, type: String })
    declare public pictureUrl?: string;

    @Expose()
    @ApiProperty({ required: false, type: String })
    declare public locale?: string;

    @Expose()
    @ApiProperty({ required: false, type: String })
    declare public timeZone?: string;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: false, type: Date })
    declare public updatedAt?: Date;
}
