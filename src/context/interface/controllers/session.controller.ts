import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Delete } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, Tokens, Public, FormatResponse } from "~common/decorators";
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
        @Extract.Session() { session }: Extract.Session.Public,
        @Extract.Meta() context: Extract.Meta,
        @Tokens.Refresh() refreshToken?: string,
    ): Promise<Commands.Session.Refresh.Result> {
        return this.sessionCommands.refresh({ context, input: { refreshToken, session } });
    }

    @Delete("logout")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Purge specific sessions" })
    public logout(
        @Extract.Session() { account: actor, session }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.sessionCommands.purge({ context, actor, input: { sessions: [session] } });
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Purge specific sessions" })
    public purge(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: PurgeBodyDTO,
    ): Promise<MessageResult> {
        return this.sessionCommands.purge({ context, actor, input });
    }

    @Delete("purge-all")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Purge all sessions" })
    public purgeAll(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.sessionCommands.purgeAll({ context, actor });
    }
}
