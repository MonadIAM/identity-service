import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { Extract, Public, FormatResponse } from "~common/decorators";
import { BaseReadQueryDTO, SuccessMessageDTO } from "~common/dto";
import { ACCOUNT_COMMANDS } from "~context/application/commands";
import { ACCOUNT_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { ResponseViewType } from "~context/enums";

import {
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

const { CREATED, OK } = HttpStatus;

@ApiTags("Account")
@Controller("/account")
@UseInterceptors(MonitoringInterceptor)
export class AccountController {
    public constructor(
        @Inject(ACCOUNT_COMMANDS)
        private readonly accountCommands: Commands.Account.Contract,
        @Inject(ACCOUNT_QUERIES)
        private readonly accountQueries: Queries.Account.Contract,
    ) {}

    @Get("me")
    @HttpCode(OK)
    @FormatResponse(AccountDTO)
    @ApiResponse({ status: OK, type: AccountDTO })
    @ApiOperation({ summary: "Get current account" })
    public getMe(@Extract.Session() { account }: Extract.Session.Auth): Promise<Queries.Account.Entity> {
        return this.accountQueries.findUnique({ account, view: ResponseViewType.DETAILED });
    }

    @Get()
    @HttpCode(OK)
    @FormatResponse(AccountDTO)
    @ApiResponse({ status: OK, type: AccountDTO })
    @ApiOperation({ summary: "Get account by ID" })
    public getById(@Query() { account, view }: GetByIdQueryDTO): Promise<Queries.Account.Entity> {
        return this.accountQueries.findUnique({ account, view });
    }

    @HttpCode(OK)
    @Post("list")
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({ summary: "Get paginated list of accounts" })
    public getList(
        @Body() { pagination, filters, sort }: GetListBodyDTO,
        @Query() { view }: BaseReadQueryDTO,
    ): Promise<[Queries.Account.Entity[], number]> {
        return this.accountQueries.findMany({ pagination, filters, sort, view });
    }

    @Public()
    @Post("signup")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Register a new account" })
    public signup(@Body() input: SignupBodyDTO, @Extract.Meta() context: Extract.Meta): Promise<MessageResult> {
        return this.accountCommands.signup({ context, input });
    }

    @Public()
    @HttpCode(OK)
    @Post("resend")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Resend verification code" })
    public resend(@Body() input: ResendBodyDTO): Promise<MessageResult> {
        return this.accountCommands.resend({ input });
    }

    @Public()
    @HttpCode(OK)
    @Post("verify")
    @FormatResponse(VerifyResultDTO)
    @ApiOperation({ summary: "Verify account with OTP" })
    public verify(
        @Body() input: VerifyBodyDTO,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<Commands.Account.Verify.Result> {
        return this.accountCommands.verify({ context, input });
    }

    @HttpCode(OK)
    @Post("suspend")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Suspend account" })
    public suspend(
        @Body() input: SuspendBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.accountCommands.suspend({ context, actor, input });
    }

    @HttpCode(OK)
    @Post("restore")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Restore account" })
    public restore(
        @Body() input: RestoreBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.accountCommands.restore({ context, actor, input });
    }
}
