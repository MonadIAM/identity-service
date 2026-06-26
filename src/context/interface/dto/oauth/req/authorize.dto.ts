import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { OAuthResponseType, CodeChallengeMethod } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "OAuthAuthorizeQuery" })
export class AuthorizeQueryDTO {
    @Expose()
    @Validator.IsEnum(OAuthResponseType)
    @ApiProperty({ required: true, enum: OAuthResponseType })
    declare public responseType: OAuthResponseType;

    @Expose()
    @Validator.IsUUID("4")
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public client: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public redirectUri: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public state: string;

    @Expose()
    @Validator.IsString()
    @Validator.Length(43, 43)
    @Validator.IsMatches(/^[A-Za-z0-9_-]{43}$/)
    @ApiProperty({ required: true, type: String })
    declare public codeChallenge: string;

    @Expose()
    @Validator.IsEnum(CodeChallengeMethod)
    @ApiProperty({ required: true, enum: CodeChallengeMethod })
    declare public codeChallengeMethod: CodeChallengeMethod;
}
