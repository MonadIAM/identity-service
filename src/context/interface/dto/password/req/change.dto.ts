import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "PasswordChangeBody" })
export class ChangeBodyDTO {
    @Expose()
    @Validator.IsPassword()
    @ApiProperty({ required: true, type: String })
    declare public newPassword: string;
}
