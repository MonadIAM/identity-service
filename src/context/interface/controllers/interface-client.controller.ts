import { Controller, HttpStatus, HttpCode, Inject, Delete, Patch, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { Extract, FormatResponse, RequirePermission, Swagger } from "~common/decorators";
import { INTERFACE_CLIENT_COMMANDS } from "~context/application/commands";
import { INTERFACE_CLIENT_QUERIES } from "~context/application/queries";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    InterfaceClientDTO,
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
    ListDTO,
} from "../dto/interface-client";

const {
    INTERFACE_CLIENT_READ_ABSOLUTE,
    INTERFACE_CLIENT_CREATE,
    INTERFACE_CLIENT_UPDATE,
    INTERFACE_CLIENT_REVOKE,
    INTERFACE_CLIENT_RESTORE,
    INTERFACE_CLIENT_PURGE,
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

@ApiTags("InterfaceClient")
@Controller("/interface-client")
export class InterfaceClientController {
    public constructor(
        @Inject(INTERFACE_CLIENT_COMMANDS)
        private readonly interfaceClientCommands: Commands.InterfaceClient.ControllerContract,
        @Inject(INTERFACE_CLIENT_QUERIES)
        private readonly interfaceClientQueries: Queries.InterfaceClient.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(InterfaceClientDTO)
    @ApiResponse({ status: OK, type: InterfaceClientDTO })
    @RequirePermission(INTERFACE_CLIENT_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get interface client by ID",
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
    ): Queries.InterfaceClient.FindUnique.Result {
        return this.interfaceClientQueries.findUnique({ client, application, realm, view, mode });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequirePermission(INTERFACE_CLIENT_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get paginated list of interface clients in an application",
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
    ): Queries.InterfaceClient.FindMany.Result {
        return this.interfaceClientQueries.findMany({ pagination, filters, application, realm, sort, view, mode });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(INTERFACE_CLIENT_CREATE)
    @ApiOperation({
        summary: "Create interface client",
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
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.InterfaceClient.Create.Result {
        return this.interfaceClientCommands.create({ context, actor, realm, input });
    }

    @Patch("update")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(INTERFACE_CLIENT_UPDATE)
    @ApiOperation({
        summary: "Update interface client",
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
        @Query() { realm, client }: UpdateQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.InterfaceClient.Update.Result {
        return this.interfaceClientCommands.update({ context, actor, realm, client, input });
    }

    @Post("revoke")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(INTERFACE_CLIENT_REVOKE)
    @ApiOperation({
        summary: "Revoke interface client",
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
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.InterfaceClient.Revoke.Result {
        return this.interfaceClientCommands.revoke({ context, actor, realm, input });
    }

    @Post("restore")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(INTERFACE_CLIENT_RESTORE)
    @ApiOperation({
        summary: "Restore interface client",
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
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.InterfaceClient.Restore.Result {
        return this.interfaceClientCommands.restore({ context, actor, realm, input });
    }

    @Delete("purge")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(INTERFACE_CLIENT_PURGE)
    @ApiOperation({
        summary: "Purge interface client",
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
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.InterfaceClient.Purge.Result {
        return this.interfaceClientCommands.purge({ context, actor, realm, input });
    }
}
