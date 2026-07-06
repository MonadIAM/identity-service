import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { Validator } from "~common/validator";

import { ValidationErrorDetailsDTO } from "./validation-error-details.dto";

@ApiSchema({ name: "OAuthErrorResponseBody" })
export class OAuthErrorResponseBodyDTO {
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
    declare public status_code: number;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiProperty({ required: false, type: String })
    declare public timestamp?: string;

    @Expose()
    @Validator.IsListOrSingleString()
    @ApiProperty({ required: true, oneOf: [{ type: "array", items: { type: "string" } }, { type: "string" }] })
    declare public error_description: string | string[];

    @Expose()
    @Validator.IsArray()
    @Validator.IsOptional()
    @Type(() => ValidationErrorDetailsDTO)
    @ApiProperty({ required: false, type: [ValidationErrorDetailsDTO] })
    declare public details?: ValidationErrorDetailsDTO[];
}
