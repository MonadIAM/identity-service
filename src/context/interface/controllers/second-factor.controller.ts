import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nLang as Lang, I18nService } from "nestjs-i18n";

import { SECOND_FACTOR_HANDLER } from "~context/application/handlers";
import { MonitoringInterceptor } from "~common/interceptors";
import { ExtractContext } from "~common/decorators";
import { BaseController } from "~common/abstract";
import { SuccessMessageDTO } from "~common/dto";

import {
    ResetByMasterCodeBodyDTO,
    ConfirmSecondFactorDTO,
    DisableEnforceBodyDTO,
    EnableEnforceBodyDTO,
    SetupSecondFactorDTO,
    Confirm2FABodyDTO,
    Remove2FABodyDTO,
    Setup2FABodyDTO,
} from "../dto/second-factor";

@ApiTags("SecondFactor")
@Controller("/second-factor")
@UseInterceptors(MonitoringInterceptor)
export class SecondFactorController extends BaseController {
    public constructor(
        @Inject(SECOND_FACTOR_HANDLER)
        private readonly secondFactorHandler: Handlers.SecondFactor.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Post("setup")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "" })
    @ApiResponse({ status: HttpStatus.CREATED, type: SetupSecondFactorDTO })
    public setup(
        @ExtractContext() context: RequestContext,
        @Body() input: Setup2FABodyDTO,
        @Lang() lang: string,
    ): Promise<SetupSecondFactorDTO> {
        return this.secondFactorHandler
            .setup({ context, input })
            .then((data) => super.formatResponse({ DTO: SetupSecondFactorDTO, data, lang }));
    }

    @Post("confirm")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "" })
    @ApiResponse({ status: HttpStatus.CREATED, type: ConfirmSecondFactorDTO })
    public confirm(
        @ExtractContext() context: RequestContext,
        @Body() input: Confirm2FABodyDTO,
        @Lang() lang: string,
    ): Promise<ConfirmSecondFactorDTO> {
        return this.secondFactorHandler
            .confirm({ context, input })
            .then((data) => super.formatResponse({ DTO: ConfirmSecondFactorDTO, data, lang }));
    }

    @Post("remove")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "" })
    @ApiResponse({ status: HttpStatus.CREATED, type: SuccessMessageDTO })
    public remove(
        @ExtractContext() context: RequestContext,
        @Body() input: Remove2FABodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.secondFactorHandler
            .remove({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Post("enable-enforce")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "" })
    @ApiResponse({ status: HttpStatus.CREATED, type: SuccessMessageDTO })
    public enableEnforce(
        @ExtractContext() context: RequestContext,
        @Body() input: EnableEnforceBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.secondFactorHandler
            .enableEnforce({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Post("disable-enforce")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "" })
    @ApiResponse({ status: HttpStatus.CREATED, type: SuccessMessageDTO })
    public disableEnforce(
        @ExtractContext() context: RequestContext,
        @Body() input: DisableEnforceBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.secondFactorHandler
            .disableEnforce({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Post("reset-dy-master-code")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "" })
    @ApiResponse({ status: HttpStatus.CREATED, type: SuccessMessageDTO })
    public resetByMasterCode(
        @ExtractContext() context: RequestContext,
        @Body() input: ResetByMasterCodeBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.secondFactorHandler
            .resetByMasterCode({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
