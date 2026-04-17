import { Expose, Type } from "class-transformer";
import { ApiProperty, ApiSchema } from "@nestjs/swagger";

import { Validator } from "~common/validator";

import { AccountDTO } from "../../account";

@ApiSchema({ name: "SecondFactor" })
export class SecondFactorDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public id: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public type: string;

    @Expose()
    @ApiProperty({ required: false, type: String })
    declare public name?: string;

    @Expose()
    @Type(() => AccountDTO)
    @ApiProperty({ required: false, type: AccountDTO })
    declare public account: AccountDTO;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: false, type: Date })
    declare public lastUsedAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: false, type: Date })
    declare public confirmedAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    declare public createdAt: Date;
}
