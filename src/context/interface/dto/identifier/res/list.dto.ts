import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { IdentifierDTO } from "./entity.dto";

@ApiSchema({ name: "IdentifierList" })
export class ListDTO extends BaseListDTO<IdentifierDTO> {
    @Type(() => IdentifierDTO)
    @ApiProperty({ required: true, type: [IdentifierDTO] })
    declare public data: IdentifierDTO[];
}
