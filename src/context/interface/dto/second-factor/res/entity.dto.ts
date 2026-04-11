import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

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
    @ApiPropertyOptional({ type: String })
    public name?: string;

    @Expose()
    @Type(() => AccountDTO)
    @ApiPropertyOptional({ type: AccountDTO })
    public account!: AccountDTO;

    @Expose()
    @Validator.IsDate()
    @ApiPropertyOptional({ type: Date })
    public lastUsedAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiPropertyOptional({ type: Date })
    public confirmedAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    public createdAt!: Date;
}
