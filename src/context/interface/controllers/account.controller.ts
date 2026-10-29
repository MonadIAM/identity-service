import { Controller, HttpStatus, HttpCode, Header, Inject, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nLang } from "nestjs-i18n";

import { PermissionCode, ResponseViewType } from "~context/enums";
import { ACCOUNT_COMMANDS } from "~context/application/commands";
import { ACCOUNT_QUERIES } from "~context/application/queries";
import { SuccessMessageDTO } from "~common/dto";
import {
    RequirePermission,
    SensitiveThrottle,
    Reauthentication,
    FormatResponse,
    Swagger,
    Extract,
    Public,
} from "~common/decorators";

import {
    VerifyResultDTO,
    SuspendBodyDTO,
    RestoreBodyDTO,
    SignupBodyDTO,
    VerifyBodyDTO,
    ResendBodyDTO,
    SecurityDTO,
    AccountDTO,
} from "../dto/account";

const { ACCOUNT_READ_PERSONAL, ACCOUNT_SUSPEND, ACCOUNT_RESTORE, ACCOUNT_DEACTIVATE } = PermissionCode;
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
    CREATED,
    OK,
} = HttpStatus;

@ApiTags("Account")
@Controller("/account")
export class AccountController {
    public constructor(
        @Inject(ACCOUNT_COMMANDS)
        private readonly accountCommands: Commands.Account.ControllerContract,
        @Inject(ACCOUNT_QUERIES)
        private readonly accountQueries: Queries.Account.ControllerContract,
    ) {}

    @Get("me")
    @HttpCode(OK)
    @FormatResponse(AccountDTO)
    @RequirePermission(ACCOUNT_READ_PERSONAL)
    @ApiResponse({ status: OK, type: AccountDTO })
    @ApiOperation({
        summary: "Get current account",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public findMe(@Extract.Session() { account }: Extract.Session.Auth): Queries.Account.FindMe.Result {
        return this.accountQueries.findMe({ account, view: ResponseViewType.DETAILED });
    }

    @HttpCode(OK)
    @Get("security")
    @FormatResponse(SecurityDTO)
    @RequirePermission(ACCOUNT_READ_PERSONAL)
    @ApiResponse({ status: OK, type: SecurityDTO })
    @ApiOperation({
        summary: "Get current account authentication methods",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public getSecurity(@Extract.Session() { account }: Extract.Session.Auth): Queries.Account.GetSecurity.Result {
        return this.accountQueries.getSecurity({ account });
    }

    @HttpCode(OK)
    @Post("deactivate")
    @Reauthentication()
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ACCOUNT_DEACTIVATE)
    @ApiOperation({
        summary: "Voluntarily deactivate the current account",
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
    public deactivate(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Account.Deactivate.Result {
        return this.accountCommands.deactivate({ context, actor });
    }

    @Public()
    @Post("signup")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({
        summary: "Register a new account",
        security: [],
    })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, CONFLICT)
    public signup(
        @Body() input: SignupBodyDTO,
        @I18nLang() locale: string,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Account.Signup.Result {
        return this.accountCommands.signup({ context, input: { ...input, locale } });
    }

    @Public()
    @HttpCode(OK)
    @Post("resend")
    @SensitiveThrottle.OtpIssue()
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({
        summary: "Resend verification code",
        security: [],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        NOT_FOUND,
        CONFLICT,
    )
    public resend(@Body() input: ResendBodyDTO, @Extract.Meta() context: Extract.Meta): Commands.Account.Resend.Result {
        return this.accountCommands.resend({ context, input });
    }

    @Public()
    @HttpCode(OK)
    @Post("verify")
    @Header("Pragma", "no-cache")
    @Header("Cache-Control", "no-store")
    @FormatResponse(VerifyResultDTO)
    @SensitiveThrottle.OtpVerify()
    @ApiOperation({
        summary: "Verify account with OTP",
        security: [],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        BAD_REQUEST,
        NOT_FOUND,
        CONFLICT,
    )
    public verify(@Body() input: VerifyBodyDTO, @Extract.Meta() context: Extract.Meta): Commands.Account.Verify.Result {
        return this.accountCommands.verify({ context, input });
    }

    @HttpCode(OK)
    @Post("suspend")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ACCOUNT_SUSPEND)
    @ApiOperation({
        security: [{ identity: [] }],
        summary: "Suspend account",
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        FORBIDDEN,
    )
    public suspend(
        @Body() input: SuspendBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Account.Suspend.Result {
        return this.accountCommands.suspend({ context, actor, input });
    }

    @HttpCode(OK)
    @Post("restore")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ACCOUNT_RESTORE)
    @ApiOperation({
        security: [{ identity: [] }],
        summary: "Restore account",
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        FORBIDDEN,
    )
    public restore(
        @Body() input: RestoreBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Account.Restore.Result {
        return this.accountCommands.restore({ context, actor, input });
    }
}
