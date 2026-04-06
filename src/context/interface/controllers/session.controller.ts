import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Delete } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ExtractSession, ExtractContext, Public, FormatResponse } from "~common/decorators";
import { SESSION_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";

import { PurgeBodyDTO } from "../dto/session";

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
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Refresh session tokens" })
    public refresh(
        @ExtractSession() { tokens, session }: SessionContext.Public,
        @ExtractContext() context: RequestContext,
    ): Promise<Commands.Session.Refresh.Result> {
        return this.sessionCommands.refresh({ context, input: { refreshToken: tokens?.refresh, session } });
    }

    @Delete("logout")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Purge specific sessions" })
    public logout(
        @ExtractSession() { account: actor, session }: SessionContext.Auth,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.sessionCommands.purge({ context, actor, input: { sessions: [session] } });
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Purge specific sessions" })
    public purge(
        @ExtractSession() { account: actor }: SessionContext.Auth,
        @ExtractContext() context: RequestContext,
        @Body() input: PurgeBodyDTO,
    ): Promise<MessageResult> {
        return this.sessionCommands.purge({ context, actor, input });
    }

    @Delete("purge-all")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Purge all sessions" })
    public purgeAll(
        @ExtractSession() { account: actor }: SessionContext.Auth,
        @ExtractContext() context: RequestContext,
    ): Promise<MessageResult> {
        return this.sessionCommands.purgeAll({ context, actor });
    }
}
