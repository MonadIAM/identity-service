import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Delete, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, Tokens, Public, FormatResponse, Swagger, RequirePermission } from "~common/decorators";
import { SESSION_COMMANDS } from "~context/application/commands";
import { SESSION_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import { RevokeBodyDTO, SessionDTO, ListDTO, RefreshResultDTO } from "../dto/session";

const { SESSION_READ_PERSONAL, SESSION_READ_ABSOLUTE, SESSION_LOGOUT, SESSION_REVOKE } = PermissionCode;
const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    BAD_REQUEST,
    NOT_FOUND,
    FORBIDDEN,
    CONFLICT,
    OK,
} = HttpStatus;

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
    @RequirePermission(SESSION_READ_PERSONAL)
    @ApiOperation({ summary: "Get current session" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public getCurrent(@Extract.Session() { session, account }: Extract.Session.Auth): Queries.Session.GetCurrent.Result {
        return this.sessionQueries.getCurrent({ session, account });
    }

    @Get("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiOperation({ summary: "Get list of sessions" })
    @RequirePermission(SESSION_READ_PERSONAL, SESSION_READ_ABSOLUTE)
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, FORBIDDEN)
    public getList(@Extract.Session() { account }: Extract.Session.Auth): Queries.Session.FindMany.Result {
        return this.sessionQueries.findMany({ account });
    }

    @Public()
    @HttpCode(OK)
    @Post("refresh")
    @FormatResponse(RefreshResultDTO)
    @ApiOperation({ summary: "Refresh session tokens" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, BAD_REQUEST, CONFLICT)
    public refresh(
        @Extract.Meta() context: Extract.Meta,
        @Tokens.Refresh() refreshToken?: string,
    ): Commands.Session.Refresh.Result {
        return this.sessionCommands.refresh({ context, input: { refreshToken } });
    }

    @HttpCode(OK)
    @Delete("logout")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(SESSION_LOGOUT)
    @ApiOperation({ summary: "Revoke current session" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, CONFLICT, FORBIDDEN)
    public logout(
        @Extract.Session() { account: actor, session }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Session.Revoke.Result {
        return this.sessionCommands.revoke({ context, actor, input: { sessions: [session] } });
    }

    @HttpCode(OK)
    @Delete("revoke")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(SESSION_REVOKE)
    @ApiOperation({ summary: "Revoke specific sessions" })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
        CONFLICT,
    )
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
    @RequirePermission(SESSION_REVOKE)
    @ApiOperation({ summary: "Revoke all sessions" })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        NOT_FOUND,
        FORBIDDEN,
        CONFLICT,
    )
    public revokeAll(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Session.RevokeAll.Result {
        return this.sessionCommands.revokeAll({ context, actor });
    }
}
