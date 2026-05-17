import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Delete, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, Tokens, Public, FormatResponse } from "~common/decorators";
import { SESSION_COMMANDS } from "~context/application/commands";
import { SESSION_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";

import { RevokeBodyDTO, SessionDTO, ListDTO } from "../dto/session";

const { OK } = HttpStatus;

@ApiTags("Session")
@Controller("/session")
@UseInterceptors(MonitoringInterceptor)
export class SessionController {
    public constructor(
        @Inject(SESSION_COMMANDS)
        private readonly sessionCommands: Commands.Session.ControllerContract,
        @Inject(SESSION_QUERIES)
        private readonly sessionQueries: Queries.Session.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(SessionDTO)
    @ApiOperation({ summary: "Get current session" })
    public getCurrent(@Extract.Session() { session, account }: Extract.Session.Auth): Queries.Session.GetCurrent.Result {
        return this.sessionQueries.getCurrent({ session, account });
    }

    @Get("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiOperation({ summary: "Get list of sessions" })
    public getList(@Extract.Session() { account }: Extract.Session.Auth): Queries.Session.FindMany.Result {
        return this.sessionQueries.findMany({ account });
    }

    @Public()
    @HttpCode(OK)
    @Post("refresh")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Refresh session tokens" })
    public refresh(
        @Extract.Session() { session }: Extract.Session.Public,
        @Extract.Meta() context: Extract.Meta,
        @Tokens.Refresh() refreshToken?: string,
    ): Commands.Session.Refresh.Result {
        return this.sessionCommands.refresh({ context, input: { refreshToken, session } });
    }

    @HttpCode(OK)
    @Delete("logout")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Revoke current session" })
    public logout(
        @Extract.Session() { account: actor, session }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Session.Revoke.Result {
        return this.sessionCommands.revoke({ context, actor, input: { sessions: [session] } });
    }

    @HttpCode(OK)
    @Delete("revoke")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Revoke specific sessions" })
    public revoke(
        @Body() input: RevokeBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Session.Revoke.Result {
        return this.sessionCommands.revoke({ context, actor, input });
    }

    @HttpCode(OK)
    @Delete("revoke-all")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Revoke all sessions" })
    public revokeAll(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Session.RevokeAll.Result {
        return this.sessionCommands.revokeAll({ context, actor });
    }
}
