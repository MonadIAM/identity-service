import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { InviteStatus } from "~context/enums";
import { Validator } from "~common/validator";

import { AccountLookupDTO } from "../../account";

@ApiSchema({ name: "Invite" })
export class InviteDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public id: string;

    @Expose()
    @Validator.IsEnum(InviteStatus)
    @ApiProperty({ required: true, enum: InviteStatus, enumName: "InviteStatus" })
    declare public status: InviteStatus;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => AccountLookupDTO)
    @ApiProperty({ required: true, type: AccountLookupDTO })
    declare public invitee: AccountLookupDTO;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => AccountLookupDTO)
    @ApiProperty({ required: true, type: AccountLookupDTO })
    declare public inviter: AccountLookupDTO;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;

    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public role: string;

    @Expose()
    @Validator.IsDate()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: Date })
    declare public updatedAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    declare public createdAt: Date;

    @Expose()
    @Validator.IsInt()
    @ApiProperty({ required: true, type: Number })
    declare public version: number;
}
