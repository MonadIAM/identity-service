import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { IdentifierType } from "~context/enums";
import { Validator } from "~common/validator";

export class CreateIdentifierBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public identifier!: string;

    @Expose()
    @Validator.IsEnum(IdentifierType)
    @ApiProperty({ required: true, enum: IdentifierType, enumName: "IdentifierType" })
    public type!: IdentifierType;
}
