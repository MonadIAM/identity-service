import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Patch } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ExtractSession, ExtractContext, Public } from "~common/decorators";
import { ACCOUNT_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";

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
    @ApiOperation({ summary: "Register a new account" })
    public create(@ExtractContext() context: RequestContext, @Body() input: any) {
        return this.accountCommands.create({ context, input });
    }

    @Public()
    @Post("confirm")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Confirm account with OTP" })
    public confirm(@ExtractContext() context: RequestContext, @Body() input: any) {
        return this.accountCommands.confirm({ context, input });
    }

    @Public()
    @Post("resend")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Resend verification code" })
    public resend(@Body() input: any) {
        return this.accountCommands.resend({ input });
    }

    @Patch("deactivate")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Deactivate account" })
    public deactivate(@ExtractSession() { account: actor }: SessionContext, @ExtractContext() context: RequestContext) {
        return this.accountCommands.deactivate({ context, actor });
    }

    @Patch("suspend")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Suspend account" })
    public suspend(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() input: Commands.Account.Suspend["input"],
    ) {
        return this.accountCommands.suspend({ context, actor, input });
    }

    @Patch("unsuspend")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Unsuspend account" })
    public unsuspend(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() input: any,
    ) {
        return this.accountCommands.unsuspend({ context, actor, input });
    }
}
