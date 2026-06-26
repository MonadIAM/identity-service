import { ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
    UseInterceptors,
    Controller,
    HttpStatus,
    HttpCode,
    Redirect,
    Header,
    Inject,
    Query,
    Body,
    Post,
    Get,
} from "@nestjs/common";

import { Extract, FormatResponse, Tokens, Public, Swagger } from "~common/decorators";
import { OAUTH_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";

import { AuthorizeQueryDTO, TokenResultDTO, TokenBodyDTO } from "../dto/oauth";

const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    BAD_REQUEST,
    FORBIDDEN,
    CONFLICT,
    FOUND,
    OK,
} = HttpStatus;

@ApiTags("OAuth")
@Controller("/oauth")
@UseInterceptors(MonitoringInterceptor)
export class OAuthController {
    public constructor(
        @Inject(OAUTH_COMMANDS)
        private readonly oauthCommands: Commands.OAuth.ControllerContract,
    ) {}

    @Public()
    @Get("authorize")
    @Redirect(undefined, FOUND)
    @Header("Pragma", "no-cache")
    @Header("Cache-Control", "no-store")
    @ApiOperation({
        summary: "Start OAuth authorization code flow",
        security: [],
    })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST)
    public authorize(@Query() input: AuthorizeQueryDTO): Commands.OAuth.Authorize.Result {
        return this.oauthCommands.authorize({ input });
    }

    @Public()
    @HttpCode(OK)
    @Post("token")
    @Header("Pragma", "no-cache")
    @Header("Cache-Control", "no-store")
    @Header("Content-Type", "application/json")
    @ApiConsumes("application/x-www-form-urlencoded")
    @FormatResponse(TokenResultDTO)
    @ApiOperation({
        summary: "OAuth token endpoint",
        security: [],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        FORBIDDEN,
        CONFLICT,
    )
    public token(
        @Body() input: TokenBodyDTO,
        @Extract.Meta() context: Extract.Meta,
        @Tokens.Refresh() refreshToken?: string,
    ): Commands.OAuth.Token.Result {
        return this.oauthCommands.token({
            input: { ...input, refreshToken },
            context,
        });
    }
}
