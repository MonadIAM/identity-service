import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

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
    @ApiPropertyOptional({ type: ProfileDTO })
    public profile?: ProfileDTO;

    @Expose()
    @Type(() => IdentifierDTO)
    @ApiPropertyOptional({ type: [IdentifierDTO] })
    public identifiers?: IdentifierDTO[];

    @Expose()
    @Validator.IsDate()
    @ApiPropertyOptional({ type: Date })
    public updatedAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    public createdAt!: Date;
}
