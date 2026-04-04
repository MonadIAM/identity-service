import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ExtractSession, ExtractContext, Public } from "~common/decorators";
import { PASSWORD_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";

@ApiTags("Password")
@Controller("/password")
@UseInterceptors(MonitoringInterceptor)
export class PasswordController {
    public constructor(
        @Inject(PASSWORD_COMMANDS)
        private readonly passwordCommands: Commands.Password.Contract,
    ) {}

    @Post("change")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Change password" })
    public change(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() { password }: any,
    ) {
        return this.passwordCommands.change({ context, actor, input: { password } });
    }

    @Public()
    @Post("request/otp")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Request password reset OTP" })
    public requestOTP(@Body() { identifier }: any) {
        return this.passwordCommands.requestOTP({ input: { identifier } });
    }

    @Public()
    @Post("reset/by-otp")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Reset password by OTP" })
    public resetByOTP(@ExtractContext() context: RequestContext, @Body() { password, code }: any) {
        return this.passwordCommands.resetByOTP({ context, input: { password, code } });
    }

    @Public()
    @Post("reset/by-code")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Reset password by recovery code" })
    public resetByRecoveryCode(@ExtractContext() context: RequestContext, @Body() { identifier, password, code }: any) {
        return this.passwordCommands.resetByRecoveryCode({ context, input: { identifier, password, code } });
    }
}
