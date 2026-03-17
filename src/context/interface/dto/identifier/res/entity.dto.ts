import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { IdentifierType } from "~context/enums";
import { Validator } from "~common/validator";

export class IdentifierDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsEnum(IdentifierType)
    @ApiProperty({ required: true, enum: IdentifierType, enumName: "IdentifierType" })
    public type!: IdentifierType;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public value!: string;

    @Expose()
    @Validator.IsString()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String })
    public provider?: string;

    @Expose()
    @Validator.IsString()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: String })
    public providerUserId?: string;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    public isVerified!: boolean;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    public receiveNotifications!: boolean;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    public allowPasswordlessLogin!: boolean;

    @Expose()
    public account!: any;

    @Expose()
    public primaryOfAccount?: any;

    @Expose()
    @Validator.IsDate()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: Date })
    public verifiedAt?: Date;

    @Expose()
    @Validator.IsDate()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: Date })
    public lastUsedAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    public createdAt!: Date;
}
