import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nLang as Lang, I18nService } from "nestjs-i18n";

import { VERIFICATION_HANDLER } from "~context/application/handlers";
import { MonitoringInterceptor } from "~common/interceptors";
import { ExtractContext } from "~common/decorators";
import { BaseController } from "~common/abstract";
import { SuccessMessageDTO } from "~common/dto";

import {
    IdentifierVerificationBodyDTO,
    AccountVerificationBodyDTO,
    ResendVerificationBodyDTO,
    AccountVerificationDTO,
} from "../dto/verification";

@ApiTags("Verification")
@Controller("/verification")
@UseInterceptors(MonitoringInterceptor)
export class VerificationController extends BaseController {
    public constructor(
        @Inject(VERIFICATION_HANDLER)
        private readonly verificationHandler: Handlers.Verification.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Post("account")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Account verification" })
    @ApiResponse({ status: HttpStatus.CREATED, type: AccountVerificationDTO })
    public verifyAccount(
        @ExtractContext() context: RequestContext,
        @Body() input: AccountVerificationBodyDTO,
        @Lang() lang: string,
    ): Promise<AccountVerificationDTO> {
        return this.verificationHandler
            .verifyAccount({ context, input })
            .then((data) => super.formatResponse({ DTO: AccountVerificationDTO, data, lang }));
    }

    @Post("identifier")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Identifier verification" })
    @ApiResponse({ status: HttpStatus.CREATED, type: SuccessMessageDTO })
    public verifyIdentifier(
        @ExtractContext() context: RequestContext,
        @Body() input: IdentifierVerificationBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.verificationHandler
            .verifyIdentifier({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Post("resend")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Resend verification" })
    @ApiResponse({ status: HttpStatus.CREATED, type: SuccessMessageDTO })
    public byPhone(@Body() input: ResendVerificationBodyDTO, @Lang() lang: string): Promise<SuccessMessageDTO> {
        return this.verificationHandler
            .resendVerification({ input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
