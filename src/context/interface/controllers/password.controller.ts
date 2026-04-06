import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, Public, FormatResponse } from "~common/decorators";
import { PASSWORD_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";

import { ResetByRecoveryCodeBodyDTO, ResetByTOTPBodyDTO, RequestTOTPBodyDTO, ChangeBodyDTO } from "../dto/password";

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
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Change password" })
    public change(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: ChangeBodyDTO,
    ): Promise<MessageResult> {
        return this.passwordCommands.change({ context, actor, input });
    }

    @Public()
    @Post("request/totp")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Request password reset OTP" })
    public requestOTP(@Body() input: RequestTOTPBodyDTO): Promise<MessageResult> {
        return this.passwordCommands.requestOTP({ input });
    }

    @Public()
    @Post("reset/totp")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Reset password by OTP" })
    public resetByOTP(@Extract.Meta() context: Extract.Meta, @Body() input: ResetByTOTPBodyDTO): Promise<MessageResult> {
        return this.passwordCommands.resetByOTP({ context, input });
    }

    @Public()
    @Post("reset/code")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Reset password by recovery code" })
    public resetByRecoveryCode(
        @Extract.Meta() context: Extract.Meta,
        @Body() input: ResetByRecoveryCodeBodyDTO,
    ): Promise<MessageResult> {
        return this.passwordCommands.resetByRecoveryCode({ context, input });
    }
}
