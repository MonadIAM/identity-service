import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { UnknownType } from "@mikro-orm/core";
import { Expose } from "class-transformer";

import { IdentityActionType, IdentityEntityType } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "AuditLog" })
export class AuditLogDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public actor!: string;

    @Expose()
    @ApiProperty({ required: true, type: UnknownType })
    public input!: UnknownType;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public ip!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public userAgent!: string;

    @Expose()
    @Validator.IsEnum(IdentityActionType)
    @ApiProperty({ required: true, enum: IdentityActionType, enumName: "IdentityActionType" })
    public actionType!: IdentityActionType;

    @Expose()
    @Validator.IsEnum(IdentityEntityType)
    @ApiProperty({ required: true, enum: IdentityEntityType, enumName: "IdentityEntityType" })
    public entityType!: IdentityEntityType;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    public createdAt!: Date;
}
