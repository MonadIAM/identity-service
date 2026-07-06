import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { OAuthResponseType, CodeChallengeMethod } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "OAuthAuthorizeQuery" })
export class AuthorizeQueryDTO {
    @Expose()
    @Validator.IsEnum(OAuthResponseType)
    @Validator.FromAlias("response_type", "responseType")
    @ApiProperty({
        required: true,
        enum: OAuthResponseType,
        name: "response_type",
        description: "Also accepted as `responseType` for backward compatibility.",
    })
    declare public responseType: OAuthResponseType;

    @Expose()
    @Validator.IsUUID("4")
    @Validator.FromAlias("client_id", "client")
    @ApiProperty({
        required: true,
        type: String,
        format: "uuid",
        name: "client_id",
        description: "Also accepted as `client` for backward compatibility.",
    })
    declare public client: string;

    @Expose()
    @Validator.IsString()
    @Validator.FromAlias("redirect_uri", "redirectUri")
    @ApiProperty({
        required: true,
        type: String,
        name: "redirect_uri",
        description: "Also accepted as `redirectUri` for backward compatibility.",
    })
    declare public redirectUri: string;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public state: string;

    @Expose()
    @Validator.IsString()
    @Validator.Length(43, 43)
    @Validator.IsMatches(/^[A-Za-z0-9_-]{43}$/)
    @Validator.FromAlias("code_challenge", "codeChallenge")
    @ApiProperty({
        required: true,
        type: String,
        name: "code_challenge",
        description: "Also accepted as `codeChallenge` for backward compatibility.",
    })
    declare public codeChallenge: string;

    @Expose()
    @Validator.IsEnum(CodeChallengeMethod)
    @Validator.FromAlias("code_challenge_method", "codeChallengeMethod")
    @ApiProperty({
        required: true,
        enum: CodeChallengeMethod,
        name: "code_challenge_method",
        description: "Also accepted as `codeChallengeMethod` for backward compatibility.",
    })
    declare public codeChallengeMethod: CodeChallengeMethod;
}
