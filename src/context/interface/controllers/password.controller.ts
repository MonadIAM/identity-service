import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nLang as Lang, I18nService } from "nestjs-i18n";

import { PASSWORD_HANDLER } from "~context/application/handlers";
import { MonitoringInterceptor } from "~common/interceptors";
import { ExtractContext } from "~common/decorators";
import { BaseController } from "~common/abstract";
import { SuccessMessageDTO } from "~common/dto";

import {
    RegenerateRecoveryCodesBodyDTO,
    ResetByRecoveryCodeBodyDTO,
    RegenerateRecoveryCodesDTO,
    RequestResetOTPBodyDTO,
    ChangePasswordBodyDTO,
    ResetByOTPBodyDTO,
} from "../dto/password";

@ApiTags("Password")
@Controller("/password")
@UseInterceptors(MonitoringInterceptor)
export class PasswordController extends BaseController {
    public constructor(
        @Inject(PASSWORD_HANDLER)
        private readonly passwordHandler: Handlers.Password.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Patch("change")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Change user password using current password" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public change(
        @ExtractContext() context: RequestContext,
        @Body() input: ChangePasswordBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.passwordHandler
            .change({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @HttpCode(HttpStatus.OK)
    @Post("/regenerate-recovery-codes")
    @ApiOperation({ summary: "Regenerate recovery codes" })
    @ApiResponse({ status: HttpStatus.OK, type: RegenerateRecoveryCodesDTO })
    public regenerateRecoveryCodes(
        @ExtractContext() context: RequestContext,
        @Body() input: RegenerateRecoveryCodesBodyDTO,
        @Lang() lang: string,
    ): Promise<RegenerateRecoveryCodesDTO> {
        return this.passwordHandler
            .regenerateRecoveryCodes({ context, input })
            .then((data) => super.formatResponse({ DTO: RegenerateRecoveryCodesDTO, data, lang }));
    }

    @HttpCode(HttpStatus.OK)
    @Post("reset-by-recovery-code")
    @ApiOperation({ summary: "Reset password using recovery code" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public resetByRecoveryCode(
        @ExtractContext() context: RequestContext,
        @Body() input: ResetByRecoveryCodeBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.passwordHandler
            .resetByRecoveryCode({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @HttpCode(HttpStatus.OK)
    @Post("request-reset-otp")
    @ApiOperation({ summary: "Request password reset OTP" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public requestResetOTP(@Body() input: RequestResetOTPBodyDTO, @Lang() lang: string): Promise<SuccessMessageDTO> {
        return this.passwordHandler
            .requestResetOTP({ input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Post("reset-by-otp")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Reset password using OTP" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public resetByOTP(
        @ExtractContext() context: RequestContext,
        @Body() input: ResetByOTPBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.passwordHandler
            .resetByOTP({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
