import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { AccountSubject, AccountStatus } from "~context/enums";
import { Validator } from "~common/validator";

import { IdentifierDTO } from "../../identifier";
import { ProfileDTO } from "../../profile";

export class AccountDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    public id!: string;

    @Expose()
    @Validator.IsEnum(AccountSubject)
    @ApiProperty({ required: true, enum: AccountSubject, enumName: "AccountSubject" })
    public subject!: AccountSubject;

    @Expose()
    @Validator.IsEnum(AccountStatus)
    @ApiProperty({ required: true, enum: AccountStatus, enumName: "AccountStatus" })
    public status!: AccountStatus;

    @Expose()
    @Type(() => ProfileDTO)
    @ApiProperty({ required: false, type: ProfileDTO })
    public profile?: ProfileDTO;

    @Expose()
    @Type(() => IdentifierDTO)
    @ApiProperty({ required: false, type: [IdentifierDTO] })
    public identifiers?: IdentifierDTO[];

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: false, type: Date })
    public updatedAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    public createdAt!: Date;
}
