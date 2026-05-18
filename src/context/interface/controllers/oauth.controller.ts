import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { OAUTH_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { Extract, Public } from "~common/decorators";

import { AuthorizeBodyDTO, CallbackBodyDTO } from "../dto/oauth";

const { OK } = HttpStatus;

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
    public authorize(@Query() input: AuthorizeBodyDTO): Commands.OAuth.Authorize.Result {
        return this.oauthCommands.authorize({ input });
    }

    @Public()
    @HttpCode(OK)
    @Get("callback")
    @ApiOperation({ summary: "OAuth callback" })
    public callback(
        @Query() input: CallbackBodyDTO,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.OAuth.Callback.Result {
        return this.oauthCommands.callback({ context, input });
    }
}
