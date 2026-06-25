import { UseInterceptors, Controller, HttpStatus, HttpCode, Header, Inject, Delete, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { REAUTHENTICATION_COMMANDS, SESSION_COMMANDS, AUTHN_COMMANDS } from "~context/application/commands";
import { Extract, FormatResponse, RequirePermission, Tokens, Public, Swagger } from "~common/decorators";
import { SESSION_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import { BySecondFactorBodyDTO, ByPasswordBodyDTO } from "../dto/reauthentication";
import { RevokeBodyDTO, SessionDTO, ListDTO } from "../dto/session";
import {
    VerifySecondFactorBodyDTO,
    AuthenticationResultDTO,
    RequestOTPBodyDTO,
    VerifyOTPBodyDTO,
    PasswordBodyDTO,
} from "../dto/authn";

const {
    REAUTHENTICATION_CONFIRM_SECOND_FACTOR,
    REAUTHENTICATION_CONFIRM_PASSWORD,
    SESSION_READ_PERSONAL,
    SESSION_READ_ABSOLUTE,
    SESSION_LOGOUT,
    SESSION_REVOKE,
} = PermissionCode;
const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    BAD_REQUEST,
    FORBIDDEN,
    NOT_FOUND,
    CONFLICT,
    OK,
} = HttpStatus;

@ApiTags("Authn")
@Controller("/authn")
@UseInterceptors(MonitoringInterceptor)
export class AuthnController {
    public constructor(
        @Inject(REAUTHENTICATION_COMMANDS)
        private readonly reauthenticationCommands: Commands.Reauthentication.ControllerContract,
        @Inject(SESSION_COMMANDS)
        private readonly sessionCommands: Commands.Session.ControllerContract,
        @Inject(AUTHN_COMMANDS)
        private readonly authnCommands: Commands.Authn.ControllerContract,
        @Inject(SESSION_QUERIES)
        private readonly sessionQueries: Queries.Session.ControllerContract,
    ) {}

    @Public()
    @HttpCode(OK)
    @Post("password")
    @Header("Pragma", "no-cache")
    @Header("Cache-Control", "no-store")
    @FormatResponse(AuthenticationResultDTO)
    @ApiOperation({
        summary: "Authenticate by password",
        security: [],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
        CONFLICT,
    )
    public password(@Body() input: PasswordBodyDTO): Commands.Authn.Password.Result {
        return this.authnCommands.password({ input });
    }

    @Public()
    @HttpCode(OK)
    @Post("request/otp")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({
        summary: "Request passwordless OTP",
        security: [],
    })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED)
    public requestOTP(@Body() input: RequestOTPBodyDTO): Commands.Authn.RequestOTP.Result {
        return this.authnCommands.requestOTP({ input });
    }

    @Public()
    @HttpCode(OK)
    @Post("verify/otp")
    @Header("Pragma", "no-cache")
    @Header("Cache-Control", "no-store")
    @FormatResponse(AuthenticationResultDTO)
    @ApiOperation({
        summary: "Verify passwordless OTP",
        security: [],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
        NOT_FOUND,
        CONFLICT,
    )
    public verifyOTP(@Body() input: VerifyOTPBodyDTO): Commands.Authn.VerifyOTP.Result {
        return this.authnCommands.verifyOTP({ input });
    }

    @Public()
    @HttpCode(OK)
    @Post("verify/2fa")
    @Header("Pragma", "no-cache")
    @Header("Cache-Control", "no-store")
    @FormatResponse(AuthenticationResultDTO)
    @ApiOperation({
        summary: "Verify second-factor TOTP",
        security: [],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        CONFLICT,
    )
    public verifySecondFactor(
        @Body() input: VerifySecondFactorBodyDTO,
        @Tokens.Pending() token?: string,
    ): Commands.Authn.VerifySecondFactor.Result {
        return this.authnCommands.verifySecondFactor({ token, input });
    }

    @HttpCode(OK)
    @Post("reauthn/password")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(REAUTHENTICATION_CONFIRM_PASSWORD)
    @ApiOperation({
        summary: "Reauthenticate by password",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        FORBIDDEN,
        NOT_FOUND,
    )
    public reauthenticateByPassword(
        @Body() input: ByPasswordBodyDTO,
        @Extract.Session() { account, session }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Reauthentication.ByPassword.Result {
        return this.reauthenticationCommands.byPassword({ actor: account, context, session, input });
    }

    @HttpCode(OK)
    @Post("reauthn/2fa")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(REAUTHENTICATION_CONFIRM_SECOND_FACTOR)
    @ApiOperation({
        summary: "Reauthenticate by TOTP",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        FORBIDDEN,
    )
    public reauthenticateBySecondFactor(
        @Body() input: BySecondFactorBodyDTO,
        @Extract.Session() { account, session }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Reauthentication.BySecondFactor.Result {
        return this.reauthenticationCommands.bySecondFactor({ actor: account, context, session, input });
    }

    @HttpCode(OK)
    @Get("session")
    @FormatResponse(SessionDTO)
    @RequirePermission(SESSION_READ_PERSONAL)
    @ApiOperation({
        summary: "Get current session",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public getCurrentSession(
        @Extract.Session() { session, account }: Extract.Session.Authenticated,
    ): Queries.Session.GetCurrent.Result {
        return this.sessionQueries.getCurrent({ session, account });
    }

    @HttpCode(OK)
    @Get("session/list")
    @FormatResponse(ListDTO)
    @RequirePermission(SESSION_READ_PERSONAL, SESSION_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get list of sessions",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, FORBIDDEN)
    public getSessions(@Extract.Session() { account }: Extract.Session.Authenticated): Queries.Session.FindMany.Result {
        return this.sessionQueries.findMany({ account });
    }

    @HttpCode(OK)
    @Delete("session/logout")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(SESSION_LOGOUT)
    @ApiOperation({
        summary: "Revoke current session",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, CONFLICT, FORBIDDEN)
    public logout(
        @Extract.Session() { account: actor, session }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Session.Revoke.Result {
        return this.sessionCommands.revoke({ context, actor, input: { sessions: [session] } });
    }

    @HttpCode(OK)
    @Delete("session/revoke")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(SESSION_REVOKE)
    @ApiOperation({
        summary: "Revoke specific sessions",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
        CONFLICT,
    )
    public revokeSessions(
        @Body() input: RevokeBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Session.Revoke.Result {
        return this.sessionCommands.revoke({ context, actor, input });
    }

    @HttpCode(OK)
    @Delete("session/revoke-all")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(SESSION_REVOKE)
    @ApiOperation({
        summary: "Revoke all sessions",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        NOT_FOUND,
        FORBIDDEN,
        CONFLICT,
    )
    public revokeAllSessions(
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Session.RevokeAll.Result {
        return this.sessionCommands.revokeAll({ context, actor });
    }
}
