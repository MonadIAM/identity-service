import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";
import { QueryMode } from "~context/enums";

@ApiSchema({ name: "MembershipHistoryGetByIdQuery" })
export class GetByIdQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public membershipHistory: string;

    public get mode(): QueryMode.DEFAULT {
        return QueryMode.DEFAULT;
    }
}

@ApiSchema({ name: "MembershipHistoryManageGetByIdQuery" })
export class ManageGetByIdQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public membershipHistory: string;

    public get mode(): QueryMode.MANAGE {
        return QueryMode.MANAGE;
    }
}
