import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { OAuthResponseType, CodeChallengeMethod } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "OAuthAuthorizeQuery" })
export class AuthorizeQueryDTO {
    @Expose({ name: "response_type" })
    @Validator.IsString()
    @ApiProperty({ required: true, enum: OAuthResponseType, name: "response_type" })
    declare public responseType: OAuthResponseType;

    @Expose({ name: "client_id" })
    @Validator.IsString()
    @ApiProperty({ required: true, type: String, name: "client_id" })
    declare public client: string;

    @Expose({ name: "redirect_uri" })
    @Validator.IsString()
    @ApiProperty({ required: true, type: String, name: "redirect_uri" })
    declare public redirectUri: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public state: string;

    @Expose({ name: "code_challenge" })
    @Validator.IsString()
    @Validator.Length(43, 43)
    @Validator.IsMatches(/^[A-Za-z0-9_-]{43}$/)
    @ApiProperty({ required: true, type: String, name: "code_challenge" })
    declare public codeChallenge: string;

    @Expose({ name: "code_challenge_method" })
    @Validator.IsString()
    @ApiProperty({ required: true, enum: CodeChallengeMethod, name: "CodeChallengeMethod" })
    declare public codeChallengeMethod: CodeChallengeMethod;
}
