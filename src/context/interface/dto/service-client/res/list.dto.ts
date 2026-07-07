import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { ServiceClientDTO } from "./entity.dto";

@ApiSchema({ name: "ServiceClientList" })
export class ListDTO extends BaseListDTO<ServiceClientDTO> {
    @Type(() => ServiceClientDTO)
    @ApiProperty({ required: true, type: [ServiceClientDTO] })
    declare public data: ServiceClientDTO[];
}
