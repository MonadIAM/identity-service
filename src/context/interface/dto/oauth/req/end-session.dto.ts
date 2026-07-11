import { ApiPropertyOptional, ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { Validator } from "~common/validator";

@ApiSchema({ name: "OAuthEndSessionQuery" })
export class EndSessionQueryDTO {
    @Expose()
    @Validator.IsString()
    @Validator.FromAlias("id_token_hint", "idTokenHint")
    @ApiProperty({
        required: true,
        type: String,
        name: "id_token_hint",
        description: "Also accepted as `idTokenHint` for backward compatibility.",
    })
    declare public idTokenHint: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @Validator.FromAlias("post_logout_redirect_uri", "postLogoutRedirectUri")
    @ApiPropertyOptional({
        type: String,
        name: "post_logout_redirect_uri",
        description: "Also accepted as `postLogoutRedirectUri` for backward compatibility.",
    })
    declare public postLogoutRedirectUri?: string;

    @Expose()
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public state?: string;
}
