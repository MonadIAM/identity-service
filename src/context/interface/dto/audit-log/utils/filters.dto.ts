import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { OrdinalFilterDTO, StringFilterDTO, LinkFilterDTO } from "~common/dto";
import { Validator } from "~common/validator";

@ApiSchema({ name: "AuditLogFilters" })
export class FiltersDTO implements Repositories.Mappers.AuditLog.Filters {
    @Expose()
    @Validator.IsOptional()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public id?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => LinkFilterDTO)
    @ApiProperty({ required: false, type: LinkFilterDTO })
    public actor?: LinkFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public ip?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public userAgent?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public actionType?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public entityType?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => OrdinalFilterDTO)
    @ApiProperty({ required: false, type: OrdinalFilterDTO })
    public createdAt?: OrdinalFilterDTO<Date>;
}
