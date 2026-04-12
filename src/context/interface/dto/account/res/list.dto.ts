import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { AccountDTO } from "./entity.dto";

@ApiSchema({ name: "AccountList" })
export class ListDTO extends BaseListDTO<AccountDTO> {
    @Type(() => AccountDTO)
    @ApiProperty({ required: true, type: [AccountDTO] })
    declare public data: AccountDTO[];
}
