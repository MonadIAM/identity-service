import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "FederatedAuthnAuthorizeQuery" })
export class FederatedAuthorizeQueryDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public provider: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @Validator.MinLength(1)
    @Validator.MaxLength(64)
    @ApiProperty({ required: false, type: String })
    declare public timeZone?: string;

    @Expose()
    @Validator.IsString()
    @Validator.MinLength(1)
    @ApiProperty({ required: true, type: String })
    declare public authorizationRequest: string;
}
