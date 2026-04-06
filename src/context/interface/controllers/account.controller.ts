import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Patch, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, Public, FormatResponse } from "~common/decorators";
import { BaseReadQueryDTO, SuccessMessageDTO } from "~common/dto";
import { ACCOUNT_COMMANDS } from "~context/application/commands";
import { ACCOUNT_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { ResponseViewType } from "~context/enums";

import {
    ConfirmAccountResultDTO,
    UnsuspendAccountBodyDTO,
    GetAccountByIdQueryDTO,
    GetAccountsListBodyDTO,
    SuspendAccountBodyDTO,
    ConfirmTOTPBodyDTO,
    ResendTOTPBodyDTO,
    AccountListDTO,
    SignupBodyDTO,
    AccountDTO,
} from "../dto/account";

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
    @HttpCode(HttpStatus.OK)
    @FormatResponse(AccountDTO)
    @ApiOperation({ summary: "Get current account" })
    public getMe(@Extract.Session() { account }: Extract.Session.Auth): Promise<Queries.Account.Entity> {
        return this.accountQueries.findUnique({ account, view: ResponseViewType.DETAILED });
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @FormatResponse(AccountDTO)
    @ApiOperation({ summary: "Get account by ID" })
    public findUnique(@Query() { account, view }: GetAccountByIdQueryDTO): Promise<Queries.Account.Entity> {
        return this.accountQueries.findUnique({ account, view });
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(AccountListDTO)
    @ApiOperation({ summary: "Get paginated list of accounts" })
    public findMany(
        @Body() { pagination, filters, sort }: GetAccountsListBodyDTO,
        @Query() { view }: BaseReadQueryDTO,
    ): Promise<[Queries.Account.Entity[], number]> {
        return this.accountQueries.findMany({ pagination, filters, sort, view });
    }

    @Public()
    @Post("signup")
    @HttpCode(HttpStatus.CREATED)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Register a new account" })
    public signup(@Extract.Meta() context: Extract.Meta, @Body() input: SignupBodyDTO): Promise<MessageResult> {
        return this.accountCommands.signup({ context, input });
    }

    @Public()
    @Post("resend")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Resend verification code" })
    public resend(@Body() input: ResendTOTPBodyDTO): Promise<MessageResult> {
        return this.accountCommands.resend({ input });
    }

    @Public()
    @Post("confirm")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(ConfirmAccountResultDTO)
    @ApiOperation({ summary: "Confirm account with TOTP" })
    public confirm(
        @Extract.Meta() context: Extract.Meta,
        @Body() input: ConfirmTOTPBodyDTO,
    ): Promise<Commands.Account.Confirm.Result> {
        return this.accountCommands.confirm({ context, input });
    }

    @Patch("suspend")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Suspend account" })
    public suspend(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: SuspendAccountBodyDTO,
    ): Promise<MessageResult> {
        return this.accountCommands.suspend({ context, actor, input });
    }

    @Patch("unsuspend")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Unsuspend account" })
    public unsuspend(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: UnsuspendAccountBodyDTO,
    ): Promise<MessageResult> {
        return this.accountCommands.unsuspend({ context, actor, input });
    }
}
