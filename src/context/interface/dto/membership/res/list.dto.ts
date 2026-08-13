import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { MembershipDTO } from "./entity.dto";

@ApiSchema({ name: "MembershipList" })
export class ListDTO extends BaseListDTO<MembershipDTO> {
    @Type(() => MembershipDTO)
    @ApiProperty({ required: true, type: [MembershipDTO] })
    declare public data: MembershipDTO[];
}
