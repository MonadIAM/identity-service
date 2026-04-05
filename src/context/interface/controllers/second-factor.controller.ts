import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Delete } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ExtractSession, ExtractContext, Public, ElevatedAccess, FormatResponse } from "~common/decorators";
import { SECOND_FACTOR_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";

import { ConfirmBodyDTO, ConfirmResultDTO, CreateBodyDTO, PurgeBodyDTO, ResetBodyDTO } from "../dto/second-factor";

@ApiTags("Second Factor")
@Controller("/second-factor")
@UseInterceptors(MonitoringInterceptor)
export class SecondFactorController {
    public constructor(
        @Inject(SECOND_FACTOR_COMMANDS)
        private readonly secondFactorCommands: Commands.SecondFactor.Contract,
    ) {}

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Create TOTP factor" })
    public create(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() input: CreateBodyDTO,
    ): Promise<Commands.SecondFactor.Create.Result> {
        return this.secondFactorCommands.create({ context, actor, input });
    }

    @Post("confirm")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(ConfirmResultDTO)
    @ApiOperation({ summary: "Confirm TOTP factor" })
    public confirm(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() input: ConfirmBodyDTO,
    ): Promise<Commands.SecondFactor.Confirm.Result> {
        return this.secondFactorCommands.confirm({ context, actor, input });
    }

    @Delete("purge")
    @ElevatedAccess()
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Purge non-active factor" })
    public purge(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() input: PurgeBodyDTO,
    ): Promise<MessageResult> {
        return this.secondFactorCommands.purge({ context, actor, input });
    }

    @Public()
    @Post("reset")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Reset all factors by master code" })
    public reset(@ExtractContext() context: RequestContext, @Body() input: ResetBodyDTO): Promise<MessageResult> {
        return this.secondFactorCommands.reset({ context, input });
    }
}
