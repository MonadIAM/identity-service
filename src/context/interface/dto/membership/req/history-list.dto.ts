import { IsNotEmptyObject, ValidateIf } from "class-validator";
import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { Validator } from "~common/validator";
import { PaginationDTO } from "~common/dto";
import { QueryMode } from "~context/enums";

import { HistoryManageFiltersDTO, HistoryCommonFiltersDTO, HistoryFiltersDTO } from "../utils/history-filters.dto";
import { HistorySortDTO } from "../utils/history-sort.dto";

@ApiSchema({ name: "MembershipHistoryBody" })
export class HistoryBodyDTO {
    @Expose()
    @ValidateIf(({ pagination }) => pagination)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: true, type: PaginationDTO })
    declare public pagination: PaginationDTO;

    @Expose()
    @ValidateIf(({ filters }) => filters)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => HistoryFiltersDTO)
    @ApiProperty({ required: true, type: HistoryFiltersDTO })
    declare public filters: HistoryFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => HistorySortDTO)
    @ApiProperty({ required: true, type: HistorySortDTO })
    declare public sort: HistorySortDTO;
}

@ApiSchema({ name: "MembershipHistoryCommonBody" })
export class HistoryCommonBodyDTO {
    @Expose()
    @ValidateIf(({ pagination }) => pagination)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: true, type: PaginationDTO })
    declare public pagination: PaginationDTO;

    @Expose()
    @ValidateIf(({ filters }) => filters)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => HistoryCommonFiltersDTO)
    @ApiProperty({ required: true, type: HistoryCommonFiltersDTO })
    declare public filters: HistoryCommonFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => HistorySortDTO)
    @ApiProperty({ required: true, type: HistorySortDTO })
    declare public sort: HistorySortDTO;
}

@ApiSchema({ name: "MembershipHistoryManageBody" })
export class HistoryManageBodyDTO {
    @Expose()
    @ValidateIf(({ pagination }) => pagination)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => PaginationDTO)
    @ApiProperty({ required: true, type: PaginationDTO })
    declare public pagination: PaginationDTO;

    @Expose()
    @ValidateIf(({ filters }) => filters)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => HistoryManageFiltersDTO)
    @ApiProperty({ required: true, type: HistoryManageFiltersDTO })
    declare public filters: HistoryManageFiltersDTO;

    @Expose()
    @ValidateIf(({ sort }) => sort)
    @IsNotEmptyObject()
    @Validator.ValidateNested()
    @Type(() => HistorySortDTO)
    @ApiProperty({ required: true, type: HistorySortDTO })
    declare public sort: HistorySortDTO;
}

@ApiSchema({ name: "MembershipHistoryQuery" })
export class HistoryQueryDTO {
    public get mode(): QueryMode.DEFAULT {
        return QueryMode.DEFAULT;
    }
}

@ApiSchema({ name: "MembershipHistoryCommonQuery" })
export class HistoryCommonQueryDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public realm: string;

    public get mode(): QueryMode.COMMON {
        return QueryMode.COMMON;
    }
}

@ApiSchema({ name: "MembershipHistoryManageQuery" })
export class HistoryManageQueryDTO {
    public get mode(): QueryMode.MANAGE {
        return QueryMode.MANAGE;
    }
}
