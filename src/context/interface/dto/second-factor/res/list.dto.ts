import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { SecondFactorDTO } from "./entity.dto";

@ApiSchema({ name: "SecondFactorList" })
export class ListDTO extends BaseListDTO<SecondFactorDTO> {
    @Type(() => SecondFactorDTO)
    @ApiProperty({ required: true, type: [SecondFactorDTO] })
    declare public data: SecondFactorDTO[];
}
