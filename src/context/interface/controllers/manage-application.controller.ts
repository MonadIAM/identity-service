import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequireGlobalPermission, FormatResponse, Swagger } from "~common/decorators";
import { APPLICATION_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import {
    ManageGetListQueryDTO,
    ManageGetByIdQueryDTO,
    ManageGetListBodyDTO,
    ApplicationDTO,
    ListDTO,
} from "../dto/application";

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
const { APPLICATION_READ_ABSOLUTE } = PermissionCode;

@ApiTags("Application")
@Controller("/application/manage")
@UseInterceptors(MonitoringInterceptor)
export class ApplicationManageController {
    public constructor(
        @Inject(APPLICATION_QUERIES)
        private readonly applicationQueries: Queries.Application.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(ApplicationDTO)
    @ApiResponse({ status: OK, type: ApplicationDTO })
    @RequireGlobalPermission(APPLICATION_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get application by ID (any realm)",
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
    public findUnique(@Query() { application, view, mode }: ManageGetByIdQueryDTO): Queries.Application.FindUnique.Result {
        return this.applicationQueries.findUnique({ application, view, mode });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequireGlobalPermission(APPLICATION_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get paginated list of applications (any realm)",
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
    ): Queries.Application.FindMany.Result {
        return this.applicationQueries.findMany({ mode, pagination, filters, sort, view });
    }
}
