import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { HistoryDTO } from "./history-entity.dto";

@ApiSchema({ name: "MembershipHistoryList" })
export class HistoryListDTO extends BaseListDTO<HistoryDTO> {
    @Type(() => HistoryDTO)
    @ApiProperty({ required: true, type: [HistoryDTO] })
    declare public data: HistoryDTO[];
}
