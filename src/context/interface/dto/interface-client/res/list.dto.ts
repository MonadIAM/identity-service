import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { InterfaceClientDTO } from "./entity.dto";

@ApiSchema({ name: "InterfaceClientList" })
export class ListDTO extends BaseListDTO<InterfaceClientDTO> {
    @Type(() => InterfaceClientDTO)
    @ApiProperty({ required: true, type: [InterfaceClientDTO] })
    declare public data: InterfaceClientDTO[];
}
