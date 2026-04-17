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
    declare public id: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public actor: string;

    @Expose()
    @ApiProperty({ required: true, type: UnknownType })
    declare public input: UnknownType;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public ip: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public userAgent: string;

    @Expose()
    @Validator.IsEnum(IdentityActionType)
    @ApiProperty({ required: true, enum: IdentityActionType, enumName: "IdentityActionType" })
    declare public actionType: IdentityActionType;

    @Expose()
    @Validator.IsEnum(IdentityEntityType)
    @ApiProperty({ required: true, enum: IdentityEntityType, enumName: "IdentityEntityType" })
    declare public entityType: IdentityEntityType;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    declare public createdAt: Date;
}
