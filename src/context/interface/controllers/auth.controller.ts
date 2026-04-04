import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { FastifyRequest } from "fastify";

import { ExtractContext, Public } from "~common/decorators";
import { AUTH_HANDLER } from "~context/application/handlers";
import { MonitoringInterceptor } from "~common/interceptors";

@ApiTags("Auth")
@Controller("/auth")
@UseInterceptors(MonitoringInterceptor)
export class AuthController {
    public constructor(
        @Inject(AUTH_HANDLER)
        private readonly authHandler: Handlers.Auth.Contract,
    ) {}

    @Post()
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Login by password" })
    public byPassword(@ExtractContext() context: RequestContext, @Body() input: any) {
        return this.authHandler.byPassword({ context, input });
    }

    @Public()
    @Post("otp/request")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Request passwordless OTP" })
    public requestOTP(@Body() input: any) {
        return this.authHandler.requestOTP({ input });
    }

    @Public()
    @Post("otp/confirm")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Confirm passwordless OTP" })
    public confirmOTP(@ExtractContext() context: RequestContext, @Body() input: any) {
        return this.authHandler.confirmOTP({ context, input });
    }

    @Public()
    @Post("2fa/confirm")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Verify 2FA TOTP code" })
    public verify2FA(@ExtractContext() context: RequestContext, @Body() body: any, @Req() req: FastifyRequest) {
        console.log(req.cookies, req.headers.cookie);
        return this.authHandler.verify2FA({
            context,
            input: {
                pendingToken: req.cookies["pending_token"]!,
                code: body.code,
            },
        });
    }
}
