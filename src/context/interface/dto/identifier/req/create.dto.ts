import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { IdentifierType } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "IdentifierCreateBody" })
export class CreateBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public identifier: string;

    @Expose()
    @Validator.IsEnum(IdentifierType)
    @ApiProperty({ required: true, enum: IdentifierType, enumName: "IdentifierType" })
    declare public type: IdentifierType;
}
