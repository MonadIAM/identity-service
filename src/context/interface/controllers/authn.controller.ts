import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, FormatResponse, Tokens, Public, Swagger } from "~common/decorators";
import { AUTHN_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";

import {
    VerifySecondFactorBodyDTO,
    RequestOTPBodyDTO,
    VerifyOTPBodyDTO,
    SigninResultDTO,
    SigninBodyDTO,
} from "../dto/authn";

const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    FORBIDDEN,
    NOT_FOUND,
    CONFLICT,
    OK,
} = HttpStatus;

@ApiTags("Authn")
@Controller("/authn")
@UseInterceptors(MonitoringInterceptor)
export class AuthnController {
    public constructor(
        @Inject(AUTHN_COMMANDS)
        private readonly authnCommands: Commands.Authn.ControllerContract,
    ) {}

    @Public()
    @HttpCode(OK)
    @Post("signin")
    @FormatResponse(SigninResultDTO)
    @ApiOperation({ summary: "Signin by password" })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
        CONFLICT,
    )
    public signin(@Body() input: SigninBodyDTO, @Extract.Meta() context: Extract.Meta): Commands.Authn.Signin.Result {
        return this.authnCommands.signin({ context, input });
    }

    @Public()
    @HttpCode(OK)
    @Post("request/otp")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Request passwordless OTP" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED)
    public requestOTP(@Body() input: RequestOTPBodyDTO): Commands.Authn.RequestOTP.Result {
        return this.authnCommands.requestOTP({ input });
    }

    @Public()
    @HttpCode(OK)
    @Post("verify/otp")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Verify passwordless OTP" })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
        NOT_FOUND,
        CONFLICT,
    )
    public verifyOTP(
        @Body() input: VerifyOTPBodyDTO,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Authn.VerifyOTP.Result {
        return this.authnCommands.verifyOTP({ context, input });
    }

    @Public()
    @HttpCode(OK)
    @Post("verify/second-factor")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Verify second-factor TOTP" })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        CONFLICT,
    )
    public verifySecondFactor(
        @Body() input: VerifySecondFactorBodyDTO,
        @Extract.Meta() context: Extract.Meta,
        @Tokens.Pending() token?: string,
    ): Commands.Authn.VerifySecondFactor.Result {
        return this.authnCommands.verifySecondFactor({ token, context, input });
    }
}
