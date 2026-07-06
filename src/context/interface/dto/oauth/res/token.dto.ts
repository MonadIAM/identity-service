import { ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";

import { Validator } from "~common/validator";

@ApiSchema({ name: "OAuthTokenResult" })
export class TokenResultDTO {
    @Validator.ExposeAs("access_token")
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public accessToken?: string;

    @Validator.ExposeAs("token_type")
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public tokenType?: string;

    @Validator.ExposeAs("expires_in")
    @Validator.IsOptional()
    @Validator.IsPositiveInt()
    @ApiPropertyOptional({ type: Number })
    declare public expiresIn?: number;
}
