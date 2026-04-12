import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { SessionDTO } from "./entity.dto";

@ApiSchema({ name: "SessionList" })
export class ListDTO extends BaseListDTO<SessionDTO> {
    @Type(() => SessionDTO)
    @ApiProperty({ required: true, type: [SessionDTO] })
    declare public data: SessionDTO[];
}
