import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nLang as Lang, I18nService } from "nestjs-i18n";

import { SIGNUP_HANDLER } from "~context/application/handlers";
import { MonitoringInterceptor } from "~common/interceptors";
import { ExtractContext } from "~common/decorators";
import { BaseController } from "~common/abstract";
import { SuccessMessageDTO } from "~common/dto";

import { SignupByEmailBodyDTO, SignupByPhoneBodyDTO } from "../dto/signup";

@ApiTags("Signup")
@Controller("/signup")
@UseInterceptors(MonitoringInterceptor)
export class SignupController extends BaseController {
    public constructor(
        @Inject(SIGNUP_HANDLER)
        private readonly signupHandler: Handlers.Signup.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Post("by-email")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Signup by email" })
    @ApiResponse({ status: HttpStatus.CREATED, type: SuccessMessageDTO })
    public byEmail(
        @ExtractContext() context: RequestContext,
        @Body() input: SignupByEmailBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.signupHandler
            .byEmail({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Post("by-phone")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Signup by phone" })
    @ApiResponse({ status: HttpStatus.CREATED, type: SuccessMessageDTO })
    public byPhone(
        @ExtractContext() context: RequestContext,
        @Body() input: SignupByPhoneBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.signupHandler
            .byPhone({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
