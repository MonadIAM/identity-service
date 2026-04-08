import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CHANGE_LOG_QUERIES } from "~context/application/queries";
import { Swagger, FormatResponse } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";

import { GetChangeLogsListBodyDTO, GetChangeLogByIdQueryDTO, ChangeLogListDTO, ChangeLogDTO } from "../dto/change-log";

const { INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, OK } = HttpStatus;

@ApiTags("ChangeLog")
@Controller("/change-log")
@UseInterceptors(MonitoringInterceptor)
export class ChangeLogController {
    public constructor(
        @Inject(CHANGE_LOG_QUERIES)
        private readonly changeLogQueries: Queries.ChangeLog.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(ChangeLogDTO)
    @ApiResponse({ status: OK, type: ChangeLogDTO })
    @ApiOperation({ summary: "Returns a change log by identifier" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
    public findUnique(@Query() { log }: GetChangeLogByIdQueryDTO): Promise<Queries.ChangeLog.Entity> {
        return this.changeLogQueries.findUnique({ log });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ChangeLogListDTO)
    @ApiResponse({ status: OK, type: ChangeLogListDTO })
    @ApiOperation({ summary: "Returns a paginated list of change logs" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getList(
        @Body() { pagination, filters, sort }: GetChangeLogsListBodyDTO,
    ): Promise<[Queries.ChangeLog.Entity[], number]> {
        return this.changeLogQueries.findMany({ pagination, filters, sort });
    }
}
