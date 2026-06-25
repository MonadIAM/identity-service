import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "AuthnRequestOTPBody" })
export class RequestOTPBodyDTO {
    @Expose({ name: "auth_request" })
    @Validator.IsString()
    @ApiProperty({ required: true, type: String, name: "auth_request" })
    declare public authorizationRequest: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public identifier: string;
}
