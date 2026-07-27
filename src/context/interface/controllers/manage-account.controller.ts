import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequireGlobalPermission, FormatResponse, Swagger } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import { ManageGetListQueryDTO, ManageGetListBodyDTO, ManageGetByIdQueryDTO, AccountDTO, ListDTO } from "../dto/account";
import { ACCOUNT_QUERIES } from "../queries";

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
const { ACCOUNT_READ_ABSOLUTE } = PermissionCode;

@ApiTags("Account")
@Controller("/account/manage")
@UseInterceptors(MonitoringInterceptor)
export class AccountManageController {
    public constructor(
        @Inject(ACCOUNT_QUERIES)
        private readonly accountQueries: Queries.Account.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(AccountDTO)
    @ApiResponse({ status: OK, type: AccountDTO })
    @RequireGlobalPermission(ACCOUNT_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get account by ID (any realm)",
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
    public findUnique(@Query() { account, view, mode }: ManageGetByIdQueryDTO): Queries.Account.FindUnique.Result {
        return this.accountQueries.findUnique({ mode, account, view });
    }

    @HttpCode(OK)
    @Post("list")
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @RequireGlobalPermission(ACCOUNT_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get paginated list of accounts (any realm)",
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
    ): Queries.Account.FindMany.Result {
        return this.accountQueries.findMany({ mode, pagination, filters, sort, view });
    }
}
