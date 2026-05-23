import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, Public, FormatResponse, RequirePermission, Swagger } from "~common/decorators";
import { PASSWORD_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import { ResetByRecoveryCodeBodyDTO, ResetByOTPBodyDTO, RequestOTPBodyDTO, ChangeBodyDTO } from "../dto/password";

const { INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN, OK } = HttpStatus;
const { PASSWORD_CHANGE } = PermissionCode;

@ApiTags("Password")
@Controller("/password")
@UseInterceptors(MonitoringInterceptor)
export class PasswordController {
    public constructor(
        @Inject(PASSWORD_COMMANDS)
        private readonly passwordCommands: Commands.Password.ControllerContract,
    ) {}

    @HttpCode(OK)
    @Post("change")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PASSWORD_CHANGE)
    @ApiOperation({ summary: "Change password" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public change(
        @Body() input: ChangeBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Password.Change.Result {
        return this.passwordCommands.change({ context, actor, input });
    }

    @Public()
    @HttpCode(OK)
    @Post("request/otp")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Request password reset OTP" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public requestOTP(@Body() input: RequestOTPBodyDTO): Commands.Password.RequestOTP.Result {
        return this.passwordCommands.requestOTP({ input });
    }

    @Public()
    @HttpCode(OK)
    @Post("reset/otp")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Reset password by OTP" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public resetByOTP(
        @Body() input: ResetByOTPBodyDTO,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Password.ResetByOTP.Result {
        return this.passwordCommands.resetByOTP({ context, input });
    }

    @Public()
    @HttpCode(OK)
    @Post("reset/code")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Reset password by recovery code" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public resetByRecoveryCode(
        @Body() input: ResetByRecoveryCodeBodyDTO,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Password.ResetByRecoveryCode.Result {
        return this.passwordCommands.resetByRecoveryCode({ context, input });
    }
}
