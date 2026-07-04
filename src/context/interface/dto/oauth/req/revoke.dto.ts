import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "OAuthRevokeBody" })
export class RevokeBodyDTO {
    @Expose()
    @Validator.IsUUID("4")
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public client: string;
}
