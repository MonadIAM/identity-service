import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { OAUTH_HANDLER } from "~context/application/handlers";
import { MonitoringInterceptor } from "~common/interceptors";
import { Extract, Public } from "~common/decorators";

import { AuthorizeBodyDTO, CallbackBodyDTO } from "../dto/oauth";

const { OK } = HttpStatus;

@ApiTags("OAuth")
@Controller("/oauth")
@UseInterceptors(MonitoringInterceptor)
export class OAuthController {
    public constructor(
        @Inject(OAUTH_HANDLER)
        private readonly oauthHandler: Handlers.OAuth.Contract,
    ) {}

    @Public()
    @HttpCode(OK)
    @Get("authorize")
    @ApiOperation({ summary: "Get OAuth authorization URL" })
    public authorize(@Query() input: AuthorizeBodyDTO): Promise<Handlers.OAuth.Authorize.Result> {
        return this.oauthHandler.authorize({ input });
    }

    @Public()
    @HttpCode(OK)
    @Get("callback")
    @ApiOperation({ summary: "OAuth callback" })
    public callback(
        @Query() input: CallbackBodyDTO,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<Handlers.OAuth.Callback.Result> {
        return this.oauthHandler.callback({ context, input });
    }
}
