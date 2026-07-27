import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequireGlobalPermission, FormatResponse, Swagger } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import { INTERFACE_CLIENT_QUERIES } from "../queries";
import {
    ManageGetListQueryDTO,
    ManageGetByIdQueryDTO,
    ManageGetListBodyDTO,
    InterfaceClientDTO,
    ListDTO,
} from "../dto/interface-client";

const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    FORBIDDEN,
    NOT_FOUND,
    OK,
} = HttpStatus;
const { INTERFACE_CLIENT_READ_ABSOLUTE } = PermissionCode;

@ApiTags("InterfaceClient")
@Controller("/interface-client/manage")
@UseInterceptors(MonitoringInterceptor)
export class InterfaceClientManageController {
    public constructor(
        @Inject(INTERFACE_CLIENT_QUERIES)
        private readonly interfaceClientQueries: Queries.InterfaceClient.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(InterfaceClientDTO)
    @ApiResponse({ status: OK, type: InterfaceClientDTO })
    @RequireGlobalPermission(INTERFACE_CLIENT_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get interface client by ID (any application)",
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
    public findUnique(@Query() { client, view, mode }: ManageGetByIdQueryDTO): Queries.InterfaceClient.FindUnique.Result {
        return this.interfaceClientQueries.findUnique({ client, view, mode });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequireGlobalPermission(INTERFACE_CLIENT_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get paginated list of interface clients (any application)",
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
        @Body() { pagination, filters, sort }: ManageGetListBodyDTO,
        @Query() { view, mode }: ManageGetListQueryDTO,
    ): Queries.InterfaceClient.FindMany.Result {
        return this.interfaceClientQueries.findMany({ mode, pagination, filters, sort, view });
    }
}
