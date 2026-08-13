import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Query, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequireGlobalPermission, FormatResponse, Swagger } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import { MEMBERSHIP_HISTORY_QUERIES, MEMBERSHIP_QUERIES } from "../queries";
import {
    HistoryManageQueryDTO,
    HistoryManageBodyDTO,
    ManageQueryDTO,
    ManageBodyDTO,
    HistoryListDTO,
    ListDTO,
} from "../dto/membership";

const { INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, FORBIDDEN, OK } =
    HttpStatus;
const { MEMBERSHIP_READ_ABSOLUTE, MEMBERSHIP_HISTORY_READ_ABSOLUTE } = PermissionCode;

@ApiTags("Membership")
@Controller()
@UseInterceptors(MonitoringInterceptor)
export class MembershipManageController {
    public constructor(
        @Inject(MEMBERSHIP_QUERIES)
        private readonly membershipQueries: Queries.Membership.ControllerContract,
        @Inject(MEMBERSHIP_HISTORY_QUERIES)
        private readonly membershipHistoryQueries: Queries.MembershipHistory.ControllerContract,
    ) {}

    @HttpCode(OK)
    @Post("membership/manage")
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequireGlobalPermission(MEMBERSHIP_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Returns a paginated list of all active realm memberships",
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
        @Body() { pagination, filters, sort }: ManageBodyDTO,
        @Query() { mode }: ManageQueryDTO,
    ): Queries.Membership.FindMany.Result {
        return this.membershipQueries.findMany({ mode, pagination, filters, sort });
    }

    @HttpCode(OK)
    @Post("membership/history/manage")
    @FormatResponse(HistoryListDTO)
    @ApiResponse({ status: OK, type: HistoryListDTO })
    @RequireGlobalPermission(MEMBERSHIP_HISTORY_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Returns a paginated list of all closed membership history records",
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
    public findManyHistory(
        @Body() { pagination, filters, sort }: HistoryManageBodyDTO,
        @Query() { mode }: HistoryManageQueryDTO,
    ): Queries.MembershipHistory.FindMany.Result {
        return this.membershipHistoryQueries.findMany({ mode, pagination, filters, sort });
    }
}
