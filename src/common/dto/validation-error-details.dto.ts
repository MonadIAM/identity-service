import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "ValidationErrorDetails" })
export class ValidationErrorDetailsDTO {
    @Expose()
    @Validator.IsOptional()
    @ApiProperty({
        required: false,
        nullable: true,
        type: Object,
        oneOf: [
            { type: "object", additionalProperties: true },
            { type: "array", items: {} },
            { type: "boolean" },
            { type: "string" },
            { type: "number" },
        ],
    })
    declare public value?: ORM.UnknownType;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public constraint: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public message: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public path: string;
}
