import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequireGlobalPermission, FormatResponse, Swagger } from "~common/decorators";
import { OAUTH_CLIENT_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import {
    ManageGetListQueryDTO,
    ManageGetByIdQueryDTO,
    ManageGetListBodyDTO,
    OAuthClientDTO,
    ListDTO,
} from "../dto/oauth-client";

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
const { OAUTH_CLIENT_READ_ABSOLUTE } = PermissionCode;

@ApiTags("OAuthClient")
@Controller("/oauth-client/manage")
@UseInterceptors(MonitoringInterceptor)
export class OAuthClientManageController {
    public constructor(
        @Inject(OAUTH_CLIENT_QUERIES)
        private readonly oauthClientQueries: Queries.OAuthClient.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(OAuthClientDTO)
    @ApiResponse({ status: OK, type: OAuthClientDTO })
    @RequireGlobalPermission(OAUTH_CLIENT_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get OAuth client by ID (any realm)",
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
    public findUnique(@Query() { client, view, mode }: ManageGetByIdQueryDTO): Queries.OAuthClient.FindUnique.Result {
        return this.oauthClientQueries.findUnique({ client, view, mode });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequireGlobalPermission(OAUTH_CLIENT_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get paginated list of OAuth clients (any realm)",
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
    ): Queries.OAuthClient.FindMany.Result {
        return this.oauthClientQueries.findMany({ mode, pagination, filters, sort, view });
    }
}
