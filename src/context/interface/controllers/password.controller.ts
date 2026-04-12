import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, Public, FormatResponse } from "~common/decorators";
import { PASSWORD_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";

import { ResetByRecoveryCodeBodyDTO, ResetByOTPBodyDTO, RequestOTPBodyDTO, ChangeBodyDTO } from "../dto/password";

const { OK } = HttpStatus;

@ApiTags("Password")
@Controller("/password")
@UseInterceptors(MonitoringInterceptor)
export class PasswordController {
    public constructor(
        @Inject(PASSWORD_COMMANDS)
        private readonly passwordCommands: Commands.Password.Contract,
    ) {}

    @HttpCode(OK)
    @Post("change")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Change password" })
    public change(
        @Body() input: ChangeBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.passwordCommands.change({ context, actor, input });
    }

    @Public()
    @HttpCode(OK)
    @Post("request/otp")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Request password reset OTP" })
    public requestOTP(@Body() input: RequestOTPBodyDTO): Promise<MessageResult> {
        return this.passwordCommands.requestOTP({ input });
    }

    @Public()
    @HttpCode(OK)
    @Post("reset/otp")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Reset password by OTP" })
    public resetByOTP(@Body() input: ResetByOTPBodyDTO, @Extract.Meta() context: Extract.Meta): Promise<MessageResult> {
        return this.passwordCommands.resetByOTP({ context, input });
    }

    @Public()
    @HttpCode(OK)
    @Post("reset/code")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Reset password by recovery code" })
    public resetByRecoveryCode(
        @Body() input: ResetByRecoveryCodeBodyDTO,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.passwordCommands.resetByRecoveryCode({ context, input });
    }
}
