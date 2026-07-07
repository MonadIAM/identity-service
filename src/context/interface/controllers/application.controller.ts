import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
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

import { Extract, FormatResponse, RequirePermission, Swagger } from "~common/decorators";
import { APPLICATION_COMMANDS } from "~context/application/commands";
import { APPLICATION_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    GetByIdQueryDTO,
    GetListQueryDTO,
    RestoreQueryDTO,
    GetListBodyDTO,
    RestoreBodyDTO,
    RevokeQueryDTO,
    UpdateQueryDTO,
    CreateQueryDTO,
    ApplicationDTO,
    CreateBodyDTO,
    UpdateBodyDTO,
    RevokeBodyDTO,
    PurgeQueryDTO,
    PurgeBodyDTO,
    ListDTO,
} from "../dto/application";

const {
    APPLICATION_READ_ABSOLUTE,
    APPLICATION_CREATE,
    APPLICATION_UPDATE,
    APPLICATION_REVOKE,
    APPLICATION_RESTORE,
    APPLICATION_PURGE,
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

@ApiTags("Application")
@Controller("/application")
@UseInterceptors(MonitoringInterceptor)
export class ApplicationController {
    public constructor(
        @Inject(APPLICATION_COMMANDS)
        private readonly applicationCommands: Commands.Application.ControllerContract,
        @Inject(APPLICATION_QUERIES)
        private readonly applicationQueries: Queries.Application.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(ApplicationDTO)
    @ApiResponse({ status: OK, type: ApplicationDTO })
    @RequirePermission(APPLICATION_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get application by ID",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        NOT_FOUND,
        FORBIDDEN,
    )
    public findUnique(@Query() { application, realm, view, mode }: GetByIdQueryDTO): Queries.Application.FindUnique.Result {
        return this.applicationQueries.findUnique({ application, realm, view, mode });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(APPLICATION_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get paginated list of applications in realm",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
    )
    public findMany(
        @Body() { pagination, filters, sort }: GetListBodyDTO,
        @Query() { realm, view, mode }: GetListQueryDTO,
    ): Queries.Application.FindMany.Result {
        return this.applicationQueries.findMany({ pagination, filters, realm, sort, view, mode });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(APPLICATION_CREATE)
    @ApiOperation({
        summary: "Create application",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        FORBIDDEN,
        CONFLICT,
    )
    public create(
        @Body() input: CreateBodyDTO,
        @Query() { realm }: CreateQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Application.Create.Result {
        return this.applicationCommands.create({ context, actor, realm, input });
    }

    @Patch("update")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(APPLICATION_UPDATE)
    @ApiOperation({
        summary: "Update application",
        security: [{ identity: [] }],
    })
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
    public update(
        @Body() input: UpdateBodyDTO,
        @Query() { realm }: UpdateQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Application.Update.Result {
        return this.applicationCommands.update({ context, actor, realm, input });
    }

    @Post("revoke")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(APPLICATION_REVOKE)
    @ApiOperation({
        summary: "Revoke application",
        security: [{ identity: [] }],
    })
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
    public revoke(
        @Body() input: RevokeBodyDTO,
        @Query() { realm }: RevokeQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Application.Revoke.Result {
        return this.applicationCommands.revoke({ context, actor, realm, input });
    }

    @Post("restore")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(APPLICATION_RESTORE)
    @ApiOperation({
        summary: "Restore application",
        security: [{ identity: [] }],
    })
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
    public restore(
        @Body() input: RestoreBodyDTO,
        @Query() { realm }: RestoreQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Application.Restore.Result {
        return this.applicationCommands.restore({ context, actor, realm, input });
    }

    @Delete("purge")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(APPLICATION_PURGE)
    @ApiOperation({
        summary: "Purge application",
        security: [{ identity: [] }],
    })
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
        @Body() input: PurgeBodyDTO,
        @Query() { realm }: PurgeQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Application.Purge.Result {
        return this.applicationCommands.purge({ context, actor, realm, input });
    }
}
