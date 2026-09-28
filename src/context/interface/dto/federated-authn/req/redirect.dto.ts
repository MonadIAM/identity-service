import { ApiProperty, ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "FederatedAuthnRedirectQuery" })
export class FederatedRedirectQueryDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public provider: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public state: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public iss?: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public code?: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public error?: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public error_description?: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public error_uri?: string;
}
