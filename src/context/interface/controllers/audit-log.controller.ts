import { Body, Controller, HttpStatus, Post, HttpCode, Get, Query, UseInterceptors, Inject } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { AUDIT_LOG_QUERIES } from "~context/application/queries";
import { Swagger, FormatResponse } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";

import { GetAuditLogsListBodyDTO, GetAuditLogByIdQueryDTO, AuditLogListDTO, AuditLogDTO } from "../dto/audit-log";

const { INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, OK } = HttpStatus;

@ApiTags("AuditLog")
@Controller("/audit-log")
@UseInterceptors(MonitoringInterceptor)
export class AuditLogController {
    public constructor(
        @Inject(AUDIT_LOG_QUERIES)
        private readonly auditLogQueries: Queries.AuditLog.Contract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(AuditLogDTO)
    @ApiResponse({ status: OK, type: AuditLogDTO })
    @ApiOperation({ summary: "Returns a audit log by identifier" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
    public findUnique(@Query() { log }: GetAuditLogByIdQueryDTO): Promise<Queries.AuditLog.Entity> {
        return this.auditLogQueries.findUnique({ log });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(AuditLogListDTO)
    @ApiResponse({ status: OK, type: AuditLogListDTO })
    @ApiOperation({ summary: "Returns a paginated list of audit logs" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN)
    public getList(
        @Body() { pagination, filters, sort }: GetAuditLogsListBodyDTO,
    ): Promise<[Queries.AuditLog.Entity[], number]> {
        return this.auditLogQueries.findMany({ pagination, filters, sort });
    }
}
