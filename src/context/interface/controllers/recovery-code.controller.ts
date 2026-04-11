import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ElevatedAccess, Extract, FormatResponse } from "~common/decorators";
import { RECOVERY_CODE_COMMANDS } from "~context/application/commands";
import { RECOVERY_CODE_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";

import { RegenerateResultDTO, StatusResultDTO } from "../dto/recovery-code";

@ApiTags("RecoveryCodes")
@Controller("/recovery-codes")
@UseInterceptors(MonitoringInterceptor)
export class RecoveryCodeController {
    public constructor(
        @Inject(RECOVERY_CODE_COMMANDS)
        private readonly recoveryCodeCommands: Commands.RecoveryCode.Contract,
        @Inject(RECOVERY_CODE_QUERIES)
        private readonly recoveryCodeQueries: Queries.RecoveryCode.Contract,
    ) {}

    @Get("status")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(StatusResultDTO)
    @ApiOperation({ summary: "Get recovery codes status" })
    public getStatus(@Extract.Session() { account }: Extract.Session.Auth): Promise<Queries.RecoveryCode.GetStatus.Result> {
        return this.recoveryCodeQueries.getStatus({ account });
    }

    @ElevatedAccess()
    @Post("regenerate")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(RegenerateResultDTO)
    @ApiOperation({ summary: "Regenerate recovery codes" })
    public regenerate(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<Commands.RecoveryCode.Regenerate.Result> {
        return this.recoveryCodeCommands.regenerate({ context, actor });
    }
}
