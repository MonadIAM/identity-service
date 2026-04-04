import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Param, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { OAUTH_HANDLER } from "~context/application/handlers";
import { MonitoringInterceptor } from "~common/interceptors";
import { ExtractContext, Public } from "~common/decorators";

@ApiTags("OAuth")
@Controller("/oauth")
@UseInterceptors(MonitoringInterceptor)
export class OAuthController {
    public constructor(
        @Inject(OAUTH_HANDLER)
        private readonly oauthHandler: Handlers.OAuth.Contract,
    ) {}

    @Public()
    @Get(":provider")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Get OAuth authorization URL" })
    public authorize(@Param("provider") provider: string) {
        return this.oauthHandler.authorize({ input: { provider } });
    }

    @Public()
    @Get(":provider/callback")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "OAuth callback" })
    public callback(
        @ExtractContext() context: RequestContext,
        @Param("provider") provider: string,
        @Query("code") code: string,
        @Query("state") state: string,
    ) {
        return this.oauthHandler.callback({ context, input: { provider, code, state } });
    }
}
