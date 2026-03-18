import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Patch } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nLang as Lang, I18nService } from "nestjs-i18n";

import { ACCOUNT_HANDLER } from "~context/application/handlers";
import { MonitoringInterceptor } from "~common/interceptors";
import { ExtractContext } from "~common/decorators";
import { BaseController } from "~common/abstract";
import { SuccessMessageDTO } from "~common/dto";

import { DeactivateAccountBodyDTO, UnsuspendAccountBodyDTO, SuspendAccountBodyDTO } from "../dto/account";

@ApiTags("Account")
@Controller("/account")
@UseInterceptors(MonitoringInterceptor)
export class AccountController extends BaseController {
    public constructor(
        @Inject(ACCOUNT_HANDLER)
        private readonly accountHandler: Handlers.Account.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Patch("deactivate")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "" })
    @ApiResponse({ status: HttpStatus.CREATED, type: SuccessMessageDTO })
    public deactivate(
        @ExtractContext() context: RequestContext,
        @Body() input: DeactivateAccountBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.accountHandler
            .deactivate({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("suspend")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "" })
    @ApiResponse({ status: HttpStatus.CREATED, type: SuccessMessageDTO })
    public suspend(
        @ExtractContext() context: RequestContext,
        @Body() input: SuspendAccountBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.accountHandler
            .suspend({ context, input, actor: "00000000-0000-4000-8000-000000000000" })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("unsuspend")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "" })
    @ApiResponse({ status: HttpStatus.CREATED, type: SuccessMessageDTO })
    public unsuspend(
        @ExtractContext() context: RequestContext,
        @Body() input: UnsuspendAccountBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.accountHandler
            .unsuspend({ context, input, actor: "00000000-0000-4000-8000-000000000000" })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
