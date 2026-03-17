import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { IdentifierType } from "~context/enums";
import { Validator } from "~common/validator";

export class CreateIdentifierBodyDTO {
    @Expose()
    @Validator.IsEnum(IdentifierType)
    @ApiProperty({ required: true, enum: IdentifierType, enumName: "IdentifierType" })
    public type!: IdentifierType;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public account!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public value!: string;
}
