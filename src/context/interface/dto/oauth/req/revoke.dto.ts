import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "OAuthRevokeBody" })
export class RevokeBodyDTO {
    @Expose()
    @Validator.IsUUID("4")
    @Validator.FromAlias("client_id", "client")
    @ApiProperty({
        required: true,
        type: String,
        format: "uuid",
        name: "client_id",
        description: "Also accepted as `client` for backward compatibility.",
    })
    declare public client: string;
}
