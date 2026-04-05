import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Validator } from "~common/validator";
import { PaginationDTO } from "~common/dto";

import { AccountsFiltersDTO } from "../utils/filters.dto";
import { AccountsSortDTO } from "../utils/sort.dto";

export class GetAccountsListBodyDTO {
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
    @Type(() => AccountsFiltersDTO)
    @ApiProperty({ required: true, type: AccountsFiltersDTO })
    public filters!: AccountsFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => AccountsSortDTO)
    @ApiProperty({ required: true, type: AccountsSortDTO })
    public sort!: AccountsSortDTO;
}
