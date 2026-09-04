import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "InterfaceClientCreateQuery" })
export class CreateQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;
}

@ApiSchema({ name: "InterfaceClientCreateBody" })
export class CreateBodyDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public application: string;

    @Expose()
    @Validator.IsString()
    @Validator.MaxLength(128)
    @ApiProperty({ required: true, type: String })
    declare public name: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiProperty({ required: false, type: String })
    declare public description?: string;

    @Expose()
    @Validator.IsArray()
    @Validator.ArrayMinSize(1)
    @Validator.IsUniqueArray()
    @Validator.IsString({ each: true })
    @ApiProperty({ required: true, type: String, isArray: true })
    declare public redirectUris: string[];

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public authAddress: string;
}
