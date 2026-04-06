import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, FormatResponse, Tokens, Public } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { AUTH_HANDLER } from "~context/application/handlers";
import { SuccessMessageDTO } from "~common/dto";

import {
    ConfirmSecondFactorBodyDTO,
    RequestTOTPBodyDTO,
    ConfirmTOTPBodyDTO,
    SigninResultDTO,
    SigninBodyDTO,
} from "../dto/auth";

@ApiTags("Auth")
@Controller("/auth")
@UseInterceptors(MonitoringInterceptor)
export class AuthController {
    public constructor(
        @Inject(AUTH_HANDLER)
        private readonly authHandler: Handlers.Auth.Contract,
    ) {}

    @Public()
    @Post("signin")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SigninResultDTO)
    @ApiOperation({ summary: "Login by password" })
    public signin(
        @Extract.Meta() context: Extract.Meta,
        @Body() input: SigninBodyDTO,
    ): Promise<Handlers.Auth.Signin.Result> {
        return this.authHandler.signin({ context, input });
    }

    @Public()
    @Post("request/totp")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Request passwordless TOTP" })
    public requestOTP(@Body() input: RequestTOTPBodyDTO): Promise<MessageResult> {
        return this.authHandler.requestOTP({ input });
    }

    @Public()
    @Post("confirm/totp")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Confirm passwordless TOTP" })
    public confirmOTP(
        @Extract.Meta() context: Extract.Meta,
        @Body() input: ConfirmTOTPBodyDTO,
    ): Promise<Handlers.Auth.ConfirmOTP.Result> {
        return this.authHandler.confirmOTP({ context, input });
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post("confirm/second-factor")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Verify 2FA TOTP code" })
    public confirmSecondFactor(
        @Body() input: ConfirmSecondFactorBodyDTO,
        @Extract.Meta() context: Extract.Meta,
        @Tokens.Pending() token?: string,
    ): Promise<Handlers.Auth.ConfirmSecondFactor.Result> {
        return this.authHandler.confirmSecondFactor({ token, context, input });
    }
}
