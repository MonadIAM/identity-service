import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { OAUTH_COMMANDS } from "~context/application/commands";
import { Extract, Public, Swagger } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";

import { AuthorizeBodyDTO, CallbackBodyDTO } from "../dto/oauth";

const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    BAD_REQUEST,
    BAD_GATEWAY,
    CONFLICT,
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
    @HttpCode(OK)
    @Get("authorize")
    @ApiOperation({ summary: "Get OAuth authorization URL" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST)
    public authorize(@Query() input: AuthorizeBodyDTO): Commands.OAuth.Authorize.Result {
        return this.oauthCommands.authorize({ input });
    }

    @Public()
    @HttpCode(OK)
    @Get("callback")
    @ApiOperation({ summary: "OAuth callback" })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        BAD_GATEWAY,
        CONFLICT,
    )
    public callback(
        @Query() input: CallbackBodyDTO,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.OAuth.Callback.Result {
        return this.oauthCommands.callback({ context, input });
    }
}
