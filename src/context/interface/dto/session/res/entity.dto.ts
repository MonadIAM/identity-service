import { Expose, Type } from "class-transformer";
import { ApiProperty, ApiSchema } from "@nestjs/swagger";

import { Validator } from "~common/validator";

import { AccountDTO } from "../../account";

@ApiSchema({ name: "Session" })
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
    @ApiProperty({ required: false, type: String })
    public ip?: string;

    @Expose()
    @Type(() => AccountDTO)
    @ApiProperty({ required: false, type: AccountDTO })
    public account!: AccountDTO;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: false, type: Date })
    public lastRefreshedAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: false, type: Date })
    public expiresAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    public createdAt!: Date;
}
