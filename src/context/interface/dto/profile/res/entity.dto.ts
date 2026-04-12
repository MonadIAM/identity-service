import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "Profile" })
export class ProfileDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public displayName!: string;

    @Expose()
    @ApiProperty({ required: false, type: String })
    public pictureUrl?: string;

    @Expose()
    @ApiProperty({ required: false, type: String })
    public locale?: string;

    @Expose()
    @ApiProperty({ required: false, type: String })
    public timeZone?: string;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: false, type: Date })
    public updatedAt?: Date;
}
