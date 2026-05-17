import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CHANGE_LOG_QUERIES } from "~context/application/queries";
import { Swagger, FormatResponse } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";

import { GetListBodyDTO, GetByIdQueryDTO, ChangeLogDTO, ListDTO } from "../dto/change-log";

const { INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, OK } = HttpStatus;

@ApiTags("ChangeLog")
@Controller("/change-log")
@UseInterceptors(MonitoringInterceptor)
export class ChangeLogController {
    public constructor(
        @Inject(CHANGE_LOG_QUERIES)
        private readonly changeLogQueries: Queries.ChangeLog.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(ChangeLogDTO)
    @ApiResponse({ status: OK, type: ChangeLogDTO })
    @ApiOperation({ summary: "Returns a change log by identifier" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
    public getById(@Query() { log }: GetByIdQueryDTO): Queries.ChangeLog.FindUnique.Result {
        return this.changeLogQueries.findUnique({ log });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    @ApiOperation({ summary: "Returns a paginated list of change logs" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getList(@Body() { pagination, filters, sort }: GetListBodyDTO): Queries.ChangeLog.FindMany.Result {
        return this.changeLogQueries.findMany({ pagination, filters, sort });
    }
}
