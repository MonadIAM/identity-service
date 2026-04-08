import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { IdentifierType } from "~context/enums";
import { Validator } from "~common/validator";

export class IdentifierLookupDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public value!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public type!: IdentifierType;
}
