import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ElevatedAccess, Extract, FormatResponse, RequirePermission, Swagger } from "~common/decorators";
import { RECOVERY_CODE_COMMANDS } from "~context/application/commands";
import { RECOVERY_CODE_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { PermissionCode } from "~context/enums";

import { RegenerateResultDTO, StatusResultDTO } from "../dto/recovery-code";

const { RECOVERY_CODE_READ_STATUS, RECOVERY_CODE_REGENERATE } = PermissionCode;
const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    NOT_FOUND,
    CONFLICT,
    FORBIDDEN,
    OK,
} = HttpStatus;

@ApiTags("RecoveryCodes")
@Controller("/recovery-codes")
@UseInterceptors(MonitoringInterceptor)
export class RecoveryCodeController {
    public constructor(
        @Inject(RECOVERY_CODE_COMMANDS)
        private readonly recoveryCodeCommands: Commands.RecoveryCode.ControllerContract,
        @Inject(RECOVERY_CODE_QUERIES)
        private readonly recoveryCodeQueries: Queries.RecoveryCode.ControllerContract,
    ) {}

    @HttpCode(OK)
    @Get("status")
    @FormatResponse(StatusResultDTO)
    @RequirePermission(RECOVERY_CODE_READ_STATUS)
    @ApiOperation({ summary: "Get recovery codes status" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, FORBIDDEN)
    public getStatus(@Extract.Session() { account }: Extract.Session.Authenticated): Queries.RecoveryCode.GetStatus.Result {
        return this.recoveryCodeQueries.getStatus({ account });
    }

    @HttpCode(OK)
    @ElevatedAccess()
    @Post("regenerate")
    @FormatResponse(RegenerateResultDTO)
    @RequirePermission(RECOVERY_CODE_REGENERATE)
    @ApiOperation({ summary: "Regenerate recovery codes" })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        NOT_FOUND,
        CONFLICT,
        FORBIDDEN,
    )
    public regenerate(
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.RecoveryCode.Regenerate.Result {
        return this.recoveryCodeCommands.regenerate({ context, actor });
    }
}
