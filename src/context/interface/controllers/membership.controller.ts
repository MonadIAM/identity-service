import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Query, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequirePermission, FormatResponse, Swagger, Extract } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import { MEMBERSHIP_HISTORY_QUERIES, MEMBERSHIP_QUERIES } from "../queries";
import {
    HistoryCommonQueryDTO,
    HistoryCommonBodyDTO,
    HistoryQueryDTO,
    HistoryBodyDTO,
    HistoryListDTO,
    CommonQueryDTO,
    CommonBodyDTO,
    QueryDTO,
    BodyDTO,
    ListDTO,
} from "../dto/membership";

const {
    MEMBERSHIP_HISTORY_READ_PERSONAL,
    MEMBERSHIP_HISTORY_READ_COMMON,
    MEMBERSHIP_READ_PERSONAL,
    MEMBERSHIP_READ_COMMON,
} = PermissionCode;
const { INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, FORBIDDEN, OK } =
    HttpStatus;

@ApiTags("Membership")
@Controller()
@UseInterceptors(MonitoringInterceptor)
export class MembershipController {
    public constructor(
        @Inject(MEMBERSHIP_QUERIES)
        private readonly membershipQueries: Queries.Membership.ControllerContract,
        @Inject(MEMBERSHIP_HISTORY_QUERIES)
        private readonly membershipHistoryQueries: Queries.MembershipHistory.ControllerContract,
    ) {}

    @HttpCode(OK)
    @Post("membership/my")
    @FormatResponse(ListDTO)
    @RequirePermission(MEMBERSHIP_READ_PERSONAL)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({
        summary: "Returns a paginated list of the current account's active memberships",
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
    public getMyMembershipList(
        @Body() { pagination, filters, sort }: BodyDTO,
        @Query() { mode }: QueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
    ): Queries.Membership.FindMany.Result {
        return this.membershipQueries.findMany({ mode, pagination, filters, sort, actor });
    }

    @HttpCode(OK)
    @Post("membership")
    @FormatResponse(ListDTO)
    @RequirePermission(MEMBERSHIP_READ_COMMON)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({
        summary: "Returns a paginated list of active members within a realm",
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
    public getMembershipList(
        @Body() { pagination, filters, sort }: CommonBodyDTO,
        @Query() { realm, mode }: CommonQueryDTO,
    ): Queries.Membership.FindMany.Result {
        return this.membershipQueries.findMany({ mode, pagination, filters, sort, realm });
    }

    @HttpCode(OK)
    @Post("membership/history/my")
    @FormatResponse(HistoryListDTO)
    @RequirePermission(MEMBERSHIP_HISTORY_READ_PERSONAL)
    @ApiResponse({ status: OK, type: HistoryListDTO })
    @ApiOperation({
        summary: "Returns a paginated closed membership history for the current account",
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
    public getMyMembershipHistoryList(
        @Body() { pagination, filters, sort }: HistoryBodyDTO,
        @Query() { mode }: HistoryQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
    ): Queries.MembershipHistory.FindMany.Result {
        return this.membershipHistoryQueries.findMany({ mode, pagination, filters, sort, actor });
    }

    @HttpCode(OK)
    @Post("membership/history")
    @FormatResponse(HistoryListDTO)
    @RequirePermission(MEMBERSHIP_HISTORY_READ_COMMON)
    @ApiResponse({ status: OK, type: HistoryListDTO })
    @ApiOperation({
        summary: "Returns a paginated closed membership history within a realm",
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
    public getMembershipHistoryList(
        @Body() { pagination, filters, sort }: HistoryCommonBodyDTO,
        @Query() { realm, mode }: HistoryCommonQueryDTO,
    ): Queries.MembershipHistory.FindMany.Result {
        return this.membershipHistoryQueries.findMany({ mode, pagination, filters, sort, realm });
    }
}
