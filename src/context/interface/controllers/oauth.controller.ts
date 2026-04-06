import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { OAUTH_HANDLER } from "~context/application/handlers";
import { MonitoringInterceptor } from "~common/interceptors";
import { Extract, Public } from "~common/decorators";

import { AuthorizeBodyDTO, CallbackBodyDTO } from "../dto/oauth";

@ApiTags("OAuth")
@Controller("/oauth")
@UseInterceptors(MonitoringInterceptor)
export class OAuthController {
    public constructor(
        @Inject(OAUTH_HANDLER)
        private readonly oauthHandler: Handlers.OAuth.Contract,
    ) {}

    @Public()
    @Get("authorize")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Get OAuth authorization URL" })
    public authorize(@Query() input: AuthorizeBodyDTO): Promise<Handlers.OAuth.Authorize.Result> {
        return this.oauthHandler.authorize({ input });
    }

    @Public()
    @Get("callback")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "OAuth callback" })
    public callback(
        @Extract.Meta() context: Extract.Meta,
        @Query() input: CallbackBodyDTO,
    ): Promise<Handlers.OAuth.Callback.Result> {
        return this.oauthHandler.callback({ context, input });
    }
}
