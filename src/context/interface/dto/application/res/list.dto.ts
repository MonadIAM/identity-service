import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { ApplicationDTO } from "./entity.dto";

@ApiSchema({ name: "ApplicationList" })
export class ListDTO extends BaseListDTO<ApplicationDTO> {
    @Type(() => ApplicationDTO)
    @ApiProperty({ required: true, type: [ApplicationDTO] })
    declare public data: ApplicationDTO[];
}
