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
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import { SERVICE_CLIENT_COMMANDS } from "../commands";
import { SERVICE_CLIENT_QUERIES } from "../queries";
import {
    GetByIdQueryDTO,
    GetListQueryDTO,
    RestoreQueryDTO,
    GetListBodyDTO,
    RestoreBodyDTO,
    RevokeQueryDTO,
    UpdateQueryDTO,
    CreateQueryDTO,
    CreateBodyDTO,
    UpdateBodyDTO,
    RevokeBodyDTO,
    PurgeQueryDTO,
    PurgeBodyDTO,
    ServiceClientDTO,
    ListDTO,
} from "../dto/service-client";

const {
    SERVICE_CLIENT_READ_ABSOLUTE,
    SERVICE_CLIENT_CREATE,
    SERVICE_CLIENT_UPDATE,
    SERVICE_CLIENT_REVOKE,
    SERVICE_CLIENT_RESTORE,
    SERVICE_CLIENT_PURGE,
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

@ApiTags("ServiceClient")
@Controller("/service-client")
@UseInterceptors(MonitoringInterceptor)
export class ServiceClientController {
    public constructor(
        @Inject(SERVICE_CLIENT_COMMANDS)
        private readonly serviceClientCommands: Commands.ServiceClient.ControllerContract,
        @Inject(SERVICE_CLIENT_QUERIES)
        private readonly serviceClientQueries: Queries.ServiceClient.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(ServiceClientDTO)
    @ApiResponse({ status: OK, type: ServiceClientDTO })
    @RequirePermission(SERVICE_CLIENT_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get service client by ID",
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
    public findUnique(
        @Query() { client, application, realm, view, mode }: GetByIdQueryDTO,
    ): Queries.ServiceClient.FindUnique.Result {
        return this.serviceClientQueries.findUnique({ client, application, realm, view, mode });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(SERVICE_CLIENT_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get paginated list of service clients in an application",
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
        @Query() { application, realm, view, mode }: GetListQueryDTO,
    ): Queries.ServiceClient.FindMany.Result {
        return this.serviceClientQueries.findMany({ pagination, filters, application, realm, sort, view, mode });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(SERVICE_CLIENT_CREATE)
    @ApiOperation({
        summary: "Create service client",
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
    ): Commands.ServiceClient.Create.Result {
        return this.serviceClientCommands.create({ context, actor, realm, input });
    }

    @Patch("update")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(SERVICE_CLIENT_UPDATE)
    @ApiOperation({
        summary: "Update service client",
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
        @Body() body: UpdateBodyDTO,
        @Query() { realm, client }: UpdateQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.ServiceClient.Update.Result {
        return this.serviceClientCommands.update({ context, actor, realm, input: { client, ...body } });
    }

    @Post("revoke")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(SERVICE_CLIENT_REVOKE)
    @ApiOperation({
        summary: "Revoke service client",
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
    ): Commands.ServiceClient.Revoke.Result {
        return this.serviceClientCommands.revoke({ context, actor, realm, input });
    }

    @Post("restore")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(SERVICE_CLIENT_RESTORE)
    @ApiOperation({
        summary: "Restore service client",
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
    ): Commands.ServiceClient.Restore.Result {
        return this.serviceClientCommands.restore({ context, actor, realm, input });
    }

    @Delete("purge")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(SERVICE_CLIENT_PURGE)
    @ApiOperation({
        summary: "Purge service client",
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
    ): Commands.ServiceClient.Purge.Result {
        return this.serviceClientCommands.purge({ context, actor, realm, input });
    }
}
