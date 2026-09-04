import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "InterfaceClientUpdateQuery" })
export class UpdateQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public client: string;
}

@ApiSchema({ name: "InterfaceClientUpdateBody" })
export class UpdateBodyDTO {
    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @Validator.MaxLength(128)
    @ApiProperty({ required: false, type: String })
    declare public name?: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiProperty({ required: false, type: String })
    declare public description?: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsArray()
    @Validator.ArrayMinSize(1)
    @Validator.IsUniqueArray()
    @Validator.IsString({ each: true })
    @ApiProperty({ required: false, type: String, isArray: true })
    declare public redirectUris?: string[];

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiProperty({ required: false, type: String })
    declare public authAddress?: string;
}
