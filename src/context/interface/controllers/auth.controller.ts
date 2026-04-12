import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, FormatResponse, Tokens, Public } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { AUTH_HANDLER } from "~context/application/handlers";
import { SuccessMessageDTO } from "~common/dto";

import {
    VerifySecondFactorBodyDTO,
    RequestOTPBodyDTO,
    VerifyOTPBodyDTO,
    SigninResultDTO,
    SigninBodyDTO,
} from "../dto/auth";

const { OK } = HttpStatus;

@ApiTags("Auth")
@Controller("/auth")
@UseInterceptors(MonitoringInterceptor)
export class AuthController {
    public constructor(
        @Inject(AUTH_HANDLER)
        private readonly authHandler: Handlers.Auth.Contract,
    ) {}

    @Public()
    @HttpCode(OK)
    @Post("signin")
    @FormatResponse(SigninResultDTO)
    @ApiOperation({ summary: "Signin by password" })
    public signin(
        @Body() input: SigninBodyDTO,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<Handlers.Auth.Signin.Result> {
        return this.authHandler.signin({ context, input });
    }

    @Public()
    @HttpCode(OK)
    @Post("request/otp")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Request passwordless OTP" })
    public requestOTP(@Body() input: RequestOTPBodyDTO): Promise<MessageResult> {
        return this.authHandler.requestOTP({ input });
    }

    @Public()
    @HttpCode(OK)
    @Post("verify/otp")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Verify passwordless OTP" })
    public verifyOTP(
        @Body() input: VerifyOTPBodyDTO,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<Handlers.Auth.VerifyOTP.Result> {
        return this.authHandler.verifyOTP({ context, input });
    }

    @Public()
    @HttpCode(OK)
    @Post("verify/second-factor")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Verify second-factor TOTP" })
    public verifySecondFactor(
        @Body() input: VerifySecondFactorBodyDTO,
        @Extract.Meta() context: Extract.Meta,
        @Tokens.Pending() token?: string,
    ): Promise<Handlers.Auth.VerifySecondFactor.Result> {
        return this.authHandler.verifySecondFactor({ token, context, input });
    }
}
