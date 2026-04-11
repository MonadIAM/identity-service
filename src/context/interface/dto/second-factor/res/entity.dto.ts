import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";

import { AccountDTO } from "../../account";

export class SecondFactorDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public type!: string;

    @Expose()
    @ApiProperty({ required: false, type: String })
    public name?: string;

    @Expose()
    @Type(() => AccountDTO)
    @ApiProperty({ required: false, type: AccountDTO })
    public account!: AccountDTO;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: false, type: Date })
    public lastUsedAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: false, type: Date })
    public confirmedAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    public createdAt!: Date;
}
