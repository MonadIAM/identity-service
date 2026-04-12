import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { LookupDTO } from "./lookup-entity.dto";

@ApiSchema({ name: "IdentifierLookupList" })
export class LookupListDTO extends BaseListDTO<LookupDTO> {
    @Type(() => LookupDTO)
    @ApiProperty({ required: true, type: [LookupDTO] })
    declare public data: LookupDTO[];
}
