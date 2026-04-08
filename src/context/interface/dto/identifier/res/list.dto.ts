import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { IdentifierDTO } from "./entity.dto";

export class IdentifierListDTO extends BaseListDTO<IdentifierDTO> {
    @Type(() => IdentifierDTO)
    @ApiProperty({ required: true, type: [IdentifierDTO] })
    declare public data: IdentifierDTO[];
}
