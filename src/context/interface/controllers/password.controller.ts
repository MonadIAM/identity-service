import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, Public, FormatResponse, RequirePermission, SensitiveThrottle, Swagger } from "~common/decorators";
import { PASSWORD_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import { ResetByRecoveryCodeBodyDTO, ResetByOTPBodyDTO, RequestOTPBodyDTO, ChangeBodyDTO } from "../dto/password";

const { PASSWORD_CHANGE } = PermissionCode;
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
    OK,
} = HttpStatus;

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
    @ApiOperation({
        security: [{ identity: [] }],
        summary: "Change password",
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        CONFLICT,
        FORBIDDEN,
    )
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
    @SensitiveThrottle.OtpIssue()
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({
        summary: "Request password reset OTP",
        security: [],
    })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT)
    public requestOTP(
        @Body() input: RequestOTPBodyDTO,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Password.RequestOTP.Result {
        return this.passwordCommands.requestOTP({ context, input });
    }

    @Public()
    @HttpCode(OK)
    @Post("reset/otp")
    @SensitiveThrottle.OtpVerify()
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({
        summary: "Reset password by OTP",
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
    @SensitiveThrottle.HighImpactSecret()
    @ApiOperation({
        summary: "Reset password by recovery code",
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
    public resetByRecoveryCode(
        @Body() input: ResetByRecoveryCodeBodyDTO,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Password.ResetByRecoveryCode.Result {
        return this.passwordCommands.resetByRecoveryCode({ context, input });
    }
}
