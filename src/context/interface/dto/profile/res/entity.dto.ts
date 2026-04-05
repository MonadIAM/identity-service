import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

export class ProfileDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public displayName!: string;

    @Expose()
    @ApiPropertyOptional({ type: String })
    public pictureUrl?: string;

    @Expose()
    @ApiPropertyOptional({ type: String })
    public locale?: string;

    @Expose()
    @ApiPropertyOptional({ type: String })
    public timeZone?: string;

    @Expose()
    @Validator.IsDate()
    @ApiPropertyOptional({ type: Date })
    public updatedAt?: Date;
}
