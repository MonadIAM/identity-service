import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Delete } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ExtractSession, ExtractContext, Public } from "~common/decorators";
import { SESSION_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";

@ApiTags("Session")
@Controller("/session")
@UseInterceptors(MonitoringInterceptor)
export class SessionController {
    public constructor(
        @Inject(SESSION_COMMANDS)
        private readonly sessionCommands: Commands.Session.Contract,
    ) {}

    @Public()
    @Post("refresh")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Refresh session tokens" })
    public refresh(@ExtractSession() { refreshToken, session }: SessionContext, @ExtractContext() context: RequestContext) {
        return this.sessionCommands.refresh({
            input: { refreshToken, session },
            context,
        });
    }

    @Delete("logout")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Purge specific sessions" })
    public logout(@ExtractSession() { account, session }: SessionContext, @ExtractContext() context: RequestContext) {
        return this.sessionCommands.purge({ context, actor: account, input: { account, sessions: [session] } });
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Purge specific sessions" })
    public purge(
        @ExtractSession() { account }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() body: { sessions: string[] },
    ) {
        return this.sessionCommands.purge({ context, actor: account, input: { account, sessions: body.sessions } });
    }

    @Delete("purge-all")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Purge all sessions" })
    public purgeAll(@ExtractSession() { account }: SessionContext, @ExtractContext() context: RequestContext) {
        return this.sessionCommands.purgeAll({ context, actor: account, input: { account } });
    }
}
