import { Controller, HttpStatus, HttpCode, Inject, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequireGlobalPermission, FormatResponse, Swagger } from "~common/decorators";
import { SERVICE_CLIENT_QUERIES } from "~context/application/queries";
import { PermissionCode } from "~context/enums";

import {
    ManageGetListQueryDTO,
    ManageGetByIdQueryDTO,
    ManageGetListBodyDTO,
    ServiceClientDTO,
    ListDTO,
} from "../dto/service-client";

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
const { SERVICE_CLIENT_READ_ABSOLUTE } = PermissionCode;

@ApiTags("ServiceClient")
@Controller("/service-client/manage")
export class ServiceClientManageController {
    public constructor(
        @Inject(SERVICE_CLIENT_QUERIES)
        private readonly serviceClientQueries: Queries.ServiceClient.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(ServiceClientDTO)
    @ApiResponse({ status: OK, type: ServiceClientDTO })
    @RequireGlobalPermission(SERVICE_CLIENT_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get service client by ID (any realm)",
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
    public findUnique(@Query() { client, view, mode }: ManageGetByIdQueryDTO): Queries.ServiceClient.FindUnique.Result {
        return this.serviceClientQueries.findUnique({ client, view, mode });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequireGlobalPermission(SERVICE_CLIENT_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get paginated list of service clients (any realm)",
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
    ): Queries.ServiceClient.FindMany.Result {
        return this.serviceClientQueries.findMany({ mode, pagination, filters, sort, view });
    }
}
