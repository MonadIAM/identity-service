import { ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "OAuthTokenResult" })
export class TokenResultDTO {
    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public accessToken?: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public tokenType?: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsPositiveInt()
    @ApiPropertyOptional({ type: Number })
    declare public expiresIn?: number;
}
