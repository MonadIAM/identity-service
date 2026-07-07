import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "ServiceClientUpdateQuery" })
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

@ApiSchema({ name: "ServiceClientUpdateBody" })
export class UpdateBodyDTO {
    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
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
    @Validator.IsString({ each: true })
    @ApiProperty({ required: false, type: [String] })
    declare public allowedAddresses?: string[];
}
