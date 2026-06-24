import { UseInterceptors, Controller, HttpStatus, HttpCode, Header, Inject, Body, Post, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { Extract, Public, FormatResponse, RequirePermission, Swagger } from "~common/decorators";
import { PermissionCode, ResponseViewType } from "~context/enums";
import { ACCOUNT_COMMANDS } from "~context/application/commands";
import { ACCOUNT_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";

import {
    GetListQueryDTO,
    GetByIdQueryDTO,
    VerifyResultDTO,
    SuspendBodyDTO,
    RestoreBodyDTO,
    GetListBodyDTO,
    SignupBodyDTO,
    VerifyBodyDTO,
    ResendBodyDTO,
    AccountDTO,
    ListDTO,
} from "../dto/account";

const { ACCOUNT_READ_PERSONAL, ACCOUNT_READ_COMMON, ACCOUNT_READ_ABSOLUTE, ACCOUNT_SUSPEND, ACCOUNT_RESTORE } =
    PermissionCode;
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
@UseInterceptors(MonitoringInterceptor)
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
    public findMe(@Extract.Session() { account }: Extract.Session.Authenticated): Queries.Account.FindUnique.Result {
        return this.accountQueries.findMe({ account, view: ResponseViewType.DETAILED });
    }

    @Get()
    @HttpCode(OK)
    @FormatResponse(AccountDTO)
    @RequirePermission(ACCOUNT_READ_ABSOLUTE, ACCOUNT_READ_COMMON)
    @ApiResponse({ status: OK, type: AccountDTO })
    @ApiOperation({
        security: [{ identity: [] }],
        summary: "Get account by ID",
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        NOT_FOUND,
        FORBIDDEN,
    )
    public findUnique(@Query() { account, realm, view, mode }: GetByIdQueryDTO): Queries.Account.FindUnique.Result {
        return this.accountQueries.findUnique({ account, realm, view, mode });
    }

    @HttpCode(OK)
    @Post("list")
    @FormatResponse(ListDTO)
    @RequirePermission(ACCOUNT_READ_ABSOLUTE, ACCOUNT_READ_COMMON)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({
        summary: "Get paginated list of realm member accounts",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
    )
    public findMany(
        @Body() { pagination, filters, sort }: GetListBodyDTO,
        @Query() { realm, view, mode }: GetListQueryDTO,
    ): Queries.Account.FindMany.Result {
        return this.accountQueries.findMany({ pagination, filters, realm, sort, view, mode });
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
    public signup(@Body() input: SignupBodyDTO, @Extract.Meta() context: Extract.Meta): Commands.Account.Signup.Result {
        return this.accountCommands.signup({ context, input });
    }

    @Public()
    @HttpCode(OK)
    @Post("resend")
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
    public resend(@Body() input: ResendBodyDTO): Commands.Account.Resend.Result {
        return this.accountCommands.resend({ input });
    }

    @Public()
    @HttpCode(OK)
    @Post("verify")
    @Header("Pragma", "no-cache")
    @Header("Cache-Control", "no-store")
    @FormatResponse(VerifyResultDTO)
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
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
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
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Account.Restore.Result {
        return this.accountCommands.restore({ context, actor, input });
    }
}
