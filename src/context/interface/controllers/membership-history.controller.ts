import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequirePermission, FormatResponse, Swagger, Extract } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import { GetByIdQueryDTO, GetListQueryDTO, GetListBodyDTO, MembershipHistoryDTO, ListDTO } from "../dto/membership-history";
import { MEMBERSHIP_HISTORY_QUERIES } from "../queries";

const { MEMBERSHIP_HISTORY_READ_PERSONAL } = PermissionCode;
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

@ApiTags("MembershipHistory")
@Controller("/membership-history")
@UseInterceptors(MonitoringInterceptor)
export class MembershipHistoryController {
    public constructor(
        @Inject(MEMBERSHIP_HISTORY_QUERIES)
        private readonly membershipHistoryQueries: Queries.MembershipHistory.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(MembershipHistoryDTO)
    @RequirePermission(MEMBERSHIP_HISTORY_READ_PERSONAL)
    @ApiResponse({ status: OK, type: MembershipHistoryDTO })
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
    public getById(
        @Query() { membershipHistory, mode }: GetByIdQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
    ): Queries.MembershipHistory.FindUnique.Result {
        return this.membershipHistoryQueries.findUnique({ mode, membershipHistory, actor });
    }

    @HttpCode(OK)
    @Post("list")
    @FormatResponse(ListDTO)
    @RequirePermission(MEMBERSHIP_HISTORY_READ_PERSONAL)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({
        summary: "Returns a paginated realm membership history for the current account",
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
    public getPersonalList(
        @Body() { pagination, filters, sort }: GetListBodyDTO,
        @Query() { mode }: GetListQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
    ): Queries.MembershipHistory.FindMany.Result {
        return this.membershipHistoryQueries.findMany({ mode, pagination, filters, sort, actor });
    }
}
