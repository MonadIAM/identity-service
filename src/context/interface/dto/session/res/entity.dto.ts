import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { Validator } from "~common/validator";

import { AccountDTO } from "../../account";

export class SessionDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public userAgent!: string;

    @Expose()
    @ApiPropertyOptional({ type: String })
    public ip?: string;

    @Expose()
    @Type(() => AccountDTO)
    @ApiPropertyOptional({ type: AccountDTO })
    public account!: AccountDTO;

    @Expose()
    @Validator.IsDate()
    @ApiPropertyOptional({ type: Date })
    public lastActiveAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiPropertyOptional({ type: Date })
    public expiresAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    public createdAt!: Date;
}
