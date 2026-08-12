import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { MembershipHistoryDTO } from "./entity.dto";

@ApiSchema({ name: "MembershipHistoryList" })
export class ListDTO extends BaseListDTO<MembershipHistoryDTO> {
    @Type(() => MembershipHistoryDTO)
    @ApiProperty({ required: true, type: [MembershipHistoryDTO] })
    declare public data: MembershipHistoryDTO[];
}
