import { ApiOperation, ApiTags } from "@nestjs/swagger";
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

import { Extract, ElevatedAccess, FormatResponse } from "~common/decorators";
import { IDENTIFIER_COMMANDS } from "~context/application/commands";
import { BaseReadQueryDTO, SuccessMessageDTO } from "~common/dto";
import { IDENTIFIER_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";

import {
    GetIdentifiersLookupListQueryDTO,
    GetIdentifiersLookupListBodyDTO,
    ToggleNotificationsBodyDTO,
    TogglePublicContactBodyDTO,
    GetIdentifierByIdQueryDTO,
    GetIdentifiersListBodyDTO,
    IdentifierLookupListDTO,
    CreateIdentifierBodyDTO,
    PurgeIdentifierBodyDTO,
    ConfirmTOTPBodyDTO,
    ResendTOTPBodyDTO,
    IdentifierListDTO,
    IdentifierDTO,
} from "../dto/identifier";

@ApiTags("Identifier")
@Controller("/identifier")
@UseInterceptors(MonitoringInterceptor)
export class IdentifierController {
    public constructor(
        @Inject(IDENTIFIER_COMMANDS)
        private readonly identifierCommands: Commands.Identifier.Contract,
        @Inject(IDENTIFIER_QUERIES)
        private readonly identifierQueries: Queries.Identifier.Contract,
    ) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @FormatResponse(IdentifierDTO)
    @ApiOperation({ summary: "Get identifier by ID" })
    public findUnique(@Query() { identifier, view }: GetIdentifierByIdQueryDTO): Promise<Queries.Identifier.Entity> {
        return this.identifierQueries.findUnique({ identifier, view });
    }

    @Post("list")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(IdentifierListDTO)
    @ApiOperation({ summary: "Get paginated list of identifiers" })
    public findMany(
        @Body() { pagination, filters, sort }: GetIdentifiersListBodyDTO,
        @Query() { view }: BaseReadQueryDTO,
    ): Promise<[Queries.Identifier.Entity[], number]> {
        return this.identifierQueries.findMany({ pagination, filters, sort, view });
    }

    @HttpCode(HttpStatus.OK)
    @Post("list/lookup")
    @FormatResponse(IdentifierLookupListDTO)
    @ApiOperation({ summary: "Returns a lookup list of identifiers" })
    public getLookupList(
        @Extract.Session() { account }: Extract.Session.Auth,
        @Body() { pagination }: GetIdentifiersLookupListBodyDTO,
        @Query() { term }: GetIdentifiersLookupListQueryDTO,
    ): Promise<[Queries.Identifier.Entity[], number]> {
        return this.identifierQueries.getLookupList({ pagination, account, term });
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Add identifier" })
    public create(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: CreateIdentifierBodyDTO,
    ): Promise<MessageResult> {
        return this.identifierCommands.create({ context, actor, input });
    }

    @Post("resend")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Resend identifier verification" })
    public resend(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Body() input: ResendTOTPBodyDTO,
    ): Promise<MessageResult> {
        return this.identifierCommands.resend({ actor, input });
    }

    @Post("confirm")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Confirm identifier" })
    public confirm(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: ConfirmTOTPBodyDTO,
    ): Promise<MessageResult> {
        return this.identifierCommands.confirm({ context, actor, input });
    }

    @HttpCode(HttpStatus.OK)
    @Patch("toggle/notifications")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Toggle notifications" })
    public toggleNotifications(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: ToggleNotificationsBodyDTO,
    ): Promise<MessageResult> {
        return this.identifierCommands.toggleNotifications({ context, actor, input });
    }

    @HttpCode(HttpStatus.OK)
    @Patch("toggle/public-contact")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Toggle notifications" })
    public togglePublicContact(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: TogglePublicContactBodyDTO,
    ): Promise<MessageResult> {
        return this.identifierCommands.togglePublicContact({ context, actor, input });
    }

    @Delete("purge")
    @ElevatedAccess()
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Remove identifier" })
    public purge(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: PurgeIdentifierBodyDTO,
    ): Promise<MessageResult> {
        return this.identifierCommands.purge({ context, actor, input });
    }
}
