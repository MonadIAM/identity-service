import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { Validator } from "~common/validator";
import { PaginationDTO } from "~common/dto";

@ApiSchema({ name: "IdentifierGetLookupListBody" })
export class GetLookupListBodyDTO {
    @Expose()
    @ValidateIf(({ pagination }) => pagination)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: true, type: PaginationDTO })
    declare public pagination: PaginationDTO;
}

@ApiSchema({ name: "IdentifierGetLookupListQuery" })
export class GetLookupListQueryDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public term: string;
}
