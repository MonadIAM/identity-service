import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Patch } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ExtractSession, ExtractContext, Public, FormatResponse } from "~common/decorators";
import { ACCOUNT_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";

import {
    ConfirmAccountResultDTO,
    UnsuspendAccountBodyDTO,
    SuspendAccountBodyDTO,
    ConfirmTOTPBodyDTO,
    ResendTOTPBodyDTO,
    SignupBodyDTO,
} from "../dto/account";

@ApiTags("Account")
@Controller("/account")
@UseInterceptors(MonitoringInterceptor)
export class AccountController {
    public constructor(
        @Inject(ACCOUNT_COMMANDS)
        private readonly accountCommands: Commands.Account.Contract,
    ) {}

    @Public()
    @Post("signup")
    @HttpCode(HttpStatus.CREATED)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Register a new account" })
    public signup(@ExtractContext() context: RequestContext, @Body() input: SignupBodyDTO): Promise<MessageResult> {
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
        @ExtractContext() context: RequestContext,
        @Body() input: ConfirmTOTPBodyDTO,
    ): Promise<Commands.Account.Confirm.Result> {
        return this.accountCommands.confirm({ context, input });
    }

    @Patch("suspend")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Suspend account" })
    public suspend(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() input: SuspendAccountBodyDTO,
    ): Promise<MessageResult> {
        return this.accountCommands.suspend({ context, actor, input });
    }

    @Patch("unsuspend")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Unsuspend account" })
    public unsuspend(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() input: UnsuspendAccountBodyDTO,
    ): Promise<MessageResult> {
        return this.accountCommands.unsuspend({ context, actor, input });
    }
}
