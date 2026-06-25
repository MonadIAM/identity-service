import { ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "OAuthTokenResult" })
export class TokenResultDTO {
    @Expose({ name: "accessToken" })
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String, name: "access_token" })
    declare public access_token?: string;

    @Expose({ name: "tokenType" })
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String, name: "token_type" })
    declare public token_type?: string;

    @Expose({ name: "expiresIn" })
    @Validator.IsOptional()
    @Validator.IsPositiveInt()
    @ApiPropertyOptional({ type: Number, name: "expires_in" })
    declare public expires_in?: number;
}
