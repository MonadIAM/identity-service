import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "AccountSignupBody" })
export class SignupBodyDTO {
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
    declare public name: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @Validator.MinLength(1)
    @Validator.MaxLength(64)
    @ApiProperty({ required: false, type: String })
    declare public timeZone?: string;
}
