import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { OAuthClientDTO } from "./entity.dto";

@ApiSchema({ name: "OAuthClientList" })
export class ListDTO extends BaseListDTO<OAuthClientDTO> {
    @Type(() => OAuthClientDTO)
    @ApiProperty({ required: true, type: [OAuthClientDTO] })
    declare public data: OAuthClientDTO[];
}
