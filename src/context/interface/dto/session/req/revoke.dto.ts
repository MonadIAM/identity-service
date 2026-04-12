import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "SessionRevokeBody" })
export class RevokeBodyDTO {
    @Expose()
    @Validator.IsArray()
    @Validator.IsString({ each: true })
    @ApiProperty({ required: true, type: [String] })
    public sessions!: string[];
}
