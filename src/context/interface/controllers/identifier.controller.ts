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

import { Extract, ElevatedAccess, FormatResponse, Swagger, RequirePermission } from "~common/decorators";
import { IDENTIFIER_COMMANDS } from "~context/application/commands";
import { BaseReadQueryDTO, SuccessMessageDTO } from "~common/dto";
import { IDENTIFIER_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import {
    ToggleNotificationsBodyDTO,
    TogglePublicContactBodyDTO,
    GetLookupListQueryDTO,
    GetLookupListBodyDTO,
    GetByIdQueryDTO,
    GetListBodyDTO,
    VerifyBodyDTO,
    LookupListDTO,
    ResendBodyDTO,
    IdentifierDTO,
    CreateBodyDTO,
    PurgeQueryDTO,
    ListDTO,
} from "../dto/identifier";

const {
    IDENTIFIER_TOGGLE_PUBLIC_CONTACT,
    IDENTIFIER_TOGGLE_NOTIFICATIONS,
    IDENTIFIER_READ_ABSOLUTE,
    IDENTIFIER_READ_PERSONAL,
    IDENTIFIER_CREATE,
    IDENTIFIER_RESEND,
    IDENTIFIER_VERIFY,
    IDENTIFIER_PURGE,
} = PermissionCode;
const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    BAD_REQUEST,
    FORBIDDEN,
    NOT_FOUND,
    CONFLICT,
    CREATED,
    OK,
} = HttpStatus;

@ApiTags("Identifier")
@Controller("/identifier")
@UseInterceptors(MonitoringInterceptor)
export class IdentifierController {
    public constructor(
        @Inject(IDENTIFIER_COMMANDS)
        private readonly identifierCommands: Commands.Identifier.ControllerContract,
        @Inject(IDENTIFIER_QUERIES)
        private readonly identifierQueries: Queries.Identifier.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(IdentifierDTO)
    @ApiOperation({ summary: "Get identifier by ID" })
    @RequirePermission(IDENTIFIER_READ_PERSONAL, IDENTIFIER_READ_ABSOLUTE)
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        NOT_FOUND,
        FORBIDDEN,
    )
    public getById(@Query() { identifier, view }: GetByIdQueryDTO): Queries.Identifier.FindUnique.Result {
        return this.identifierQueries.findUnique({ identifier, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiOperation({ summary: "Get paginated list of identifiers" })
    @RequirePermission(IDENTIFIER_READ_PERSONAL, IDENTIFIER_READ_ABSOLUTE)
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
    )
    public getList(
        @Body() { pagination, filters, sort }: GetListBodyDTO,
        @Query() { view }: BaseReadQueryDTO,
    ): Queries.Identifier.FindMany.Result {
        return this.identifierQueries.findMany({ pagination, filters, sort, view });
    }

    @HttpCode(OK)
    @Post("list/lookup")
    @FormatResponse(LookupListDTO)
    @ApiOperation({ summary: "Returns a lookup list of identifiers" })
    @RequirePermission(IDENTIFIER_READ_PERSONAL, IDENTIFIER_READ_ABSOLUTE)
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
    )
    public getLookupList(
        @Body() { pagination }: GetLookupListBodyDTO,
        @Query() { term }: GetLookupListQueryDTO,
        @Extract.Session() { account }: Extract.Session.Auth,
    ): Queries.Identifier.GetLookupList.Result {
        return this.identifierQueries.getLookupList({ pagination, account, term });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(IDENTIFIER_CREATE)
    @ApiOperation({ summary: "Add identifier" })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        NOT_FOUND,
        FORBIDDEN,
        CONFLICT,
    )
    public create(
        @Body() input: CreateBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Identifier.Create.Result {
        return this.identifierCommands.create({ context, actor, input });
    }

    @HttpCode(OK)
    @Post("resend")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(IDENTIFIER_RESEND)
    @ApiOperation({ summary: "Resend identifier verification" })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        NOT_FOUND,
        FORBIDDEN,
        CONFLICT,
    )
    public resend(
        @Body() input: ResendBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
    ): Commands.Identifier.Resend.Pesult {
        return this.identifierCommands.resend({ actor, input });
    }

    @HttpCode(OK)
    @Post("verify")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(IDENTIFIER_VERIFY)
    @ApiOperation({ summary: "Verify identifier with OTP" })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        FORBIDDEN,
        CONFLICT,
    )
    public verify(
        @Body() input: VerifyBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Identifier.Verify.Result {
        return this.identifierCommands.verify({ context, actor, input });
    }

    @HttpCode(OK)
    @Patch("toggle/notifications")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Toggle notifications" })
    @RequirePermission(IDENTIFIER_TOGGLE_NOTIFICATIONS)
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        FORBIDDEN,
        CONFLICT,
    )
    public toggleNotifications(
        @Body() input: ToggleNotificationsBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Identifier.ToggleNotifications.Result {
        return this.identifierCommands.toggleNotifications({ context, actor, input });
    }

    @HttpCode(OK)
    @Patch("toggle/public-contact")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Toggle public contact" })
    @RequirePermission(IDENTIFIER_TOGGLE_PUBLIC_CONTACT)
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        FORBIDDEN,
        CONFLICT,
    )
    public togglePublicContact(
        @Body() input: TogglePublicContactBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Identifier.TogglePublicContact.Result {
        return this.identifierCommands.togglePublicContact({ context, actor, input });
    }

    @HttpCode(OK)
    @Delete("purge")
    @ElevatedAccess()
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(IDENTIFIER_PURGE)
    @ApiOperation({ summary: "Remove identifier" })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        FORBIDDEN,
        CONFLICT,
    )
    public purge(
        @Query() input: PurgeQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Identifier.Purge.Result {
        return this.identifierCommands.purge({ context, actor, input });
    }
}
