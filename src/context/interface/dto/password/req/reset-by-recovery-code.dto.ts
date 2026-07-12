import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "PasswordResetByRecoveryCodeBody" })
export class ResetByRecoveryCodeBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public identifier: string;

    @Expose()
    @Validator.IsPassword()
    @ApiProperty({ required: true, type: String })
    declare public password: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public code: string;
}
