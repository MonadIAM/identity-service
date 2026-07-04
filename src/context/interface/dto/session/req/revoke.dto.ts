import { ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "SessionRevokeBody" })
export class RevokeBodyDTO {
    @Expose()
    @Validator.IsOptional()
    @Validator.IsArray()
    @Validator.ArrayMinSize(1)
    @Validator.IsString({ each: true })
    @ApiPropertyOptional({ type: [String] })
    declare public sessions?: string[];
}
