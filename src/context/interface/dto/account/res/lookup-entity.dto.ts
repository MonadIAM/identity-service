import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { AccountSubject, AccountStatus } from "~context/enums";
import { Validator } from "~common/validator";

import { ProfileDTO } from "../../profile";

@ApiSchema({ name: "AccountLookup" })
export class AccountLookupDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public id: string;

    @Expose()
    @Validator.IsEnum(AccountSubject)
    @ApiProperty({ required: true, enum: AccountSubject, enumName: "AccountSubject" })
    declare public subject: AccountSubject;

    @Expose()
    @Validator.IsEnum(AccountStatus)
    @ApiProperty({ required: true, enum: AccountStatus, enumName: "AccountStatus" })
    declare public status: AccountStatus;

    @Expose()
    @Validator.ValidateNested()
    @Type(() => ProfileDTO)
    @ApiProperty({ required: false, type: ProfileDTO })
    declare public profile?: ProfileDTO;
}
