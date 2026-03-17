import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { I18nLang as Lang, I18nService } from "nestjs-i18n";
import {
    UseInterceptors,
    Controller,
    HttpStatus,
    HttpCode,
    Inject,
    Delete,
    Patch,
    Query,
    Body,
    Post,
    Get,
} from "@nestjs/common";

import { IDENTIFIER_REPOSITORY } from "~context/infrastructure/repositories";
import { IDENTIFIER_HANDLER } from "~context/application/handlers";
import { MonitoringInterceptor } from "~common/interceptors";
import { ExtractContext } from "~common/decorators";
import { BaseController } from "~common/abstract";
import { SuccessMessageDTO } from "~common/dto";

import {
    ToggleIdentifierPasswordlessLoginBodyDTO,
    ToggleIdentifierNotificationsBodyDTO,
    SetIdentifierAsPrimaryBodyDTO,
    ResendIdentifierOTPBodyDTO,
    GetIdentifierByIdQueryDTO,
    GetIdentifiersListBodyDTO,
    ConfirmIdentifierBodyDTO,
    CreateIdentifierBodyDTO,
    RemoveIdentifierBodyDTO,
    IdentifierListDTO,
    IdentifierDTO,
} from "../dto/identifier";

@ApiTags("Identifier")
@Controller("/identifier")
@UseInterceptors(MonitoringInterceptor)
export class IdentifierController extends BaseController {
    public constructor(
        @Inject(IDENTIFIER_REPOSITORY)
        private readonly identifierRepository: Repositories.Identifier.Contract,
        @Inject(IDENTIFIER_HANDLER)
        private readonly identifierHandler: Handlers.Identifier.Contract,
        i18nService: I18nService,
    ) {
        super(i18nService);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns an identifier by ID" })
    @ApiResponse({ status: HttpStatus.OK, type: IdentifierDTO })
    public getById(@Query() { id }: GetIdentifierByIdQueryDTO): Promise<IdentifierDTO> {
        return this.identifierRepository
            .findUniqueOrThrow({ where: { id } })
            .then((data) => super.formatResponse({ DTO: IdentifierDTO, data }));
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Returns a paginated list of identifiers" })
    @ApiResponse({ status: HttpStatus.OK, type: IdentifierListDTO })
    public getList(@Body() { pagination, filters, sort }: GetIdentifiersListBodyDTO): Promise<IdentifierListDTO> {
        return this.identifierRepository
            .findMany({ pagination, filters, sort })
            .then((data) => super.formatResponse({ DTO: IdentifierListDTO, pagination, data }));
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Creates a new identifier" })
    @ApiResponse({ status: HttpStatus.CREATED, type: SuccessMessageDTO })
    public create(
        @ExtractContext() context: RequestContext,
        @Body() input: CreateIdentifierBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.identifierHandler
            .create({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Post("resend")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Resends the OTP for identifier confirmation" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public resend(@Body() input: ResendIdentifierOTPBodyDTO, @Lang() lang: string): Promise<SuccessMessageDTO> {
        return this.identifierHandler
            .resend({ input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Post("confirm")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Confirms a new identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public confirm(
        @ExtractContext() context: RequestContext,
        @Body() input: ConfirmIdentifierBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.identifierHandler
            .confirm({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Delete("purge")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Purge an identifier" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public purge(
        @ExtractContext() context: RequestContext,
        @Body() input: RemoveIdentifierBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.identifierHandler
            .purge({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @Patch("primary")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Sets an identifier as primary" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public setPrimary(
        @ExtractContext() context: RequestContext,
        @Body() input: SetIdentifierAsPrimaryBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.identifierHandler
            .setPrimary({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @HttpCode(HttpStatus.OK)
    @Patch("notifications")
    @ApiOperation({ summary: "Updates identifier notification settings" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public toggleNotifications(
        @ExtractContext() context: RequestContext,
        @Body() input: ToggleIdentifierNotificationsBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.identifierHandler
            .toggleNotifications({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }

    @HttpCode(HttpStatus.OK)
    @Patch("passwordless-login")
    @ApiOperation({ summary: "Updates identifier passwordless login settings" })
    @ApiResponse({ status: HttpStatus.OK, type: SuccessMessageDTO })
    public togglePasswordlessLogin(
        @ExtractContext() context: RequestContext,
        @Body() input: ToggleIdentifierPasswordlessLoginBodyDTO,
        @Lang() lang: string,
    ): Promise<SuccessMessageDTO> {
        return this.identifierHandler
            .togglePasswordlessLogin({ context, input })
            .then((data) => super.formatResponse({ DTO: SuccessMessageDTO, data, lang }));
    }
}
