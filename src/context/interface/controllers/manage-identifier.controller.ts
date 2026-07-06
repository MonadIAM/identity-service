import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequireGlobalPermission, FormatResponse, Swagger } from "~common/decorators";
import { IDENTIFIER_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import {
    ManageGetByIdQueryDTO,
    ManageGetListQueryDTO,
    ManageGetListBodyDTO,
    IdentifierDTO,
    ListDTO,
} from "../dto/identifier";

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
const { IDENTIFIER_READ_ABSOLUTE } = PermissionCode;

@ApiTags("Identifier")
@Controller("/identifier/manage")
@UseInterceptors(MonitoringInterceptor)
export class IdentifierManageController {
    public constructor(
        @Inject(IDENTIFIER_QUERIES)
        private readonly identifierQueries: Queries.Identifier.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(IdentifierDTO)
    @ApiResponse({ status: OK, type: IdentifierDTO })
    @RequireGlobalPermission(IDENTIFIER_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get identifier by ID (any realm)",
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
    public findUnique(@Query() { identifier, view, mode }: ManageGetByIdQueryDTO): Queries.Identifier.FindUnique.Result {
        return this.identifierQueries.findUnique({ mode, identifier, view });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequireGlobalPermission(IDENTIFIER_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get paginated list of identifiers (any realm)",
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
    ): Queries.Identifier.FindMany.Result {
        return this.identifierQueries.findMany({ mode, pagination, filters, sort, view });
    }
}
