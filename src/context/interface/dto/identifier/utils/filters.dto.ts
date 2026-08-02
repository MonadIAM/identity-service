import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { OrdinalFilterDTO, StringFilterDTO, LinkFilterDTO } from "~common/dto";
import { Validator } from "~common/validator";

@ApiSchema({ name: "IdentifierFilters" })
export class DefaultFiltersDTO implements Adapters.Identifier.DefaultFilters {
    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public id?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public provider?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public email?: StringFilterDTO;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => StringFilterDTO)
    @ApiProperty({ required: false, type: StringFilterDTO })
    public phone?: StringFilterDTO;

    @Expose()
    @Validator.IsBoolean()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: Boolean })
    public isVerified?: boolean;

    @Expose()
    @Validator.IsBoolean()
    @Validator.IsOptional()
    @ApiProperty({ required: false, type: Boolean })
    public isPublicContact?: boolean;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => OrdinalFilterDTO)
    @ApiProperty({ required: false, type: OrdinalFilterDTO })
    public lastUsedAt?: OrdinalFilterDTO<Date>;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => OrdinalFilterDTO)
    @ApiProperty({ required: false, type: OrdinalFilterDTO })
    public createdAt?: OrdinalFilterDTO<Date>;

    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => OrdinalFilterDTO)
    @ApiProperty({ required: false, type: OrdinalFilterDTO })
    public verifiedAt?: OrdinalFilterDTO<Date>;
}

@ApiSchema({ name: "IdentifierManageFilters" })
export class ManageFiltersDTO extends DefaultFiltersDTO implements Adapters.Identifier.ManageFilters {
    @Expose()
    @Validator.IsOptional()
    @Validator.ValidateNested()
    @Type(() => LinkFilterDTO)
    @ApiProperty({ required: false, type: LinkFilterDTO })
    public account?: LinkFilterDTO;
}
