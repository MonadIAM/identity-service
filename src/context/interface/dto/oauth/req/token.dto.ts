import { ApiProperty, ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { TokenGrantType } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "OAuthTokenBody" })
export class TokenBodyDTO {
    @Expose({ name: "grant_type" })
    @Validator.IsIn([TokenGrantType.REFRESH_TOKEN])
    @Validator.IsString()
    @ApiProperty({ required: true, enum: [TokenGrantType.REFRESH_TOKEN], name: "grant_type" })
    declare public grantType: TokenGrantType.REFRESH_TOKEN;

    @Expose({ name: "client_id" })
    @Validator.IsString()
    @ApiProperty({ required: true, type: String, name: "client_id" })
    declare public client: string;

    @Expose({ name: "refresh_token" })
    @Validator.IsOptional()
    @Validator.IsString()
    @ApiPropertyOptional({ type: String, name: "refresh_token" })
    declare public refreshToken?: string;
}
