import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "PasswordSetBody" })
export class SetBodyDTO {
    @Expose()
    @Validator.IsPassword()
    @ApiProperty({ required: true, type: String })
    declare public password: string;
}
