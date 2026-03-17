import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";
import { PaginationDTO } from "~common/dto";

import { IdentifiersFiltersDTO } from "../utils/filters.dto";
import { IdentifiersSortDTO } from "../utils/sort.dto";

export class GetIdentifiersListBodyDTO {
    @Expose()
    @ValidateIf(({ pagination }) => pagination)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: true, type: PaginationDTO })
    public pagination!: PaginationDTO;

    @Expose()
    @ValidateIf(({ filters }) => filters)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => IdentifiersFiltersDTO)
    @ApiProperty({ required: true, type: IdentifiersFiltersDTO })
    public filters!: IdentifiersFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => IdentifiersSortDTO)
    @ApiProperty({ required: true, type: IdentifiersSortDTO })
    public sort!: IdentifiersSortDTO;
}
