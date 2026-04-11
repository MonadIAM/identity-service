import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { BaseListDTO } from "~common/dto";

import { SecondFactorDTO } from "./entity.dto";

export class SecondFactorListDTO extends BaseListDTO<SecondFactorDTO> {
    @Type(() => SecondFactorDTO)
    @ApiProperty({ required: true, type: [SecondFactorDTO] })
    declare public data: SecondFactorDTO[];
}
