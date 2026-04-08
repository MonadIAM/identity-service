import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { IdentifierLookupDTO } from "./lookup-entity.dto";

export class IdentifierLookupListDTO extends BaseListDTO<IdentifierLookupDTO> {
    @Type(() => IdentifierLookupDTO)
    @ApiProperty({ required: true, type: [IdentifierLookupDTO] })
    declare public data: IdentifierLookupDTO[];
}
