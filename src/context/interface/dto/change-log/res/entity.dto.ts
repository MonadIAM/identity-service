import { ChangeSetType, UnknownType } from "@mikro-orm/postgresql";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { IdentityEntityType } from "~context/enums";
import { Validator } from "~common/validator";

export class ChangeLogDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public auditEntry!: string;

    @Expose()
    @Validator.IsEnum(ChangeSetType)
    @ApiProperty({ required: true, enum: ChangeSetType, enumName: "ChangeSetType" })
    public changeType!: ChangeSetType;

    @Expose()
    @Validator.IsEnum(IdentityEntityType)
    @ApiProperty({ required: true, enum: IdentityEntityType, enumName: "IdentityEntityType" })
    public entityType!: IdentityEntityType;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public entity!: string;

    @Expose()
    @ApiProperty({ required: true, type: UnknownType })
    public delta!: UnknownType;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    public createdAt!: Date;
}
