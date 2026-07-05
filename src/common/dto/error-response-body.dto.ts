import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { Validator } from "~common/validator";

import { ValidationErrorDetailsDTO } from "./validation-error-details.dto";

@ApiSchema({ name: "ErrorResponseBody" })
export class ErrorResponseBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public code: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public error: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiProperty({ required: false, type: String })
    declare public path?: string;

    @Expose()
    @Validator.IsPositiveInt()
    @ApiProperty({ required: true, type: Number })
    declare public statusCode: number;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiProperty({ required: false, type: String })
    declare public timestamp?: string;

    @Expose()
    @Validator.IsListOrSingleString()
    @ApiProperty({ required: true, oneOf: [{ type: "array", items: { type: "string" } }, { type: "string" }] })
    declare public message: string | string[];

    @Expose()
    @Validator.IsOptional()
    @Type(() => ValidationErrorDetailsDTO)
    @Validator.IsArray()
    @ApiProperty({ required: false, type: [ValidationErrorDetailsDTO] })
    declare public details?: ValidationErrorDetailsDTO[];
}
