import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequireGlobalPermission, FormatResponse, Swagger } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import {
    ManageGetListQueryDTO,
    ManageGetListBodyDTO,
    ManageGetByIdQueryDTO,
    MembershipHistoryDTO,
    ListDTO,
} from "../dto/membership-history";
import { MEMBERSHIP_HISTORY_QUERIES } from "../queries";

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
const { MEMBERSHIP_HISTORY_READ_ABSOLUTE } = PermissionCode;

@ApiTags("MembershipHistory")
@Controller("/membership-history/manage")
@UseInterceptors(MonitoringInterceptor)
export class MembershipHistoryManageController {
    public constructor(
        @Inject(MEMBERSHIP_HISTORY_QUERIES)
        private readonly membershipHistoryQueries: Queries.MembershipHistory.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(MembershipHistoryDTO)
    @ApiResponse({ status: OK, type: MembershipHistoryDTO })
    @RequireGlobalPermission(MEMBERSHIP_HISTORY_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Returns a membership history record by identifier",
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
        @Query() { membershipHistory, mode }: ManageGetByIdQueryDTO,
    ): Queries.MembershipHistory.FindUnique.Result {
        return this.membershipHistoryQueries.findUnique({ mode, membershipHistory });
    }

    @HttpCode(OK)
    @Post("list")
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequireGlobalPermission(MEMBERSHIP_HISTORY_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Returns a paginated list of all realm membership history records",
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
        @Query() { mode }: ManageGetListQueryDTO,
    ): Queries.MembershipHistory.FindMany.Result {
        return this.membershipHistoryQueries.findMany({ mode, pagination, filters, sort });
    }
}
