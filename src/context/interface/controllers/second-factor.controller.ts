import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Delete, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, Public, ElevatedAccess, FormatResponse } from "~common/decorators";
import { SECOND_FACTOR_COMMANDS } from "~context/application/commands";
import { SECOND_FACTOR_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";

import {
    SecondFactorListDTO,
    ConfirmResultDTO,
    CreateResultDTO,
    ConfirmBodyDTO,
    CreateBodyDTO,
    PurgeBodyDTO,
    ResetBodyDTO,
} from "../dto/second-factor";

@ApiTags("Second Factor")
@Controller("/second-factor")
@UseInterceptors(MonitoringInterceptor)
export class SecondFactorController {
    public constructor(
        @Inject(SECOND_FACTOR_COMMANDS)
        private readonly secondFactorCommands: Commands.SecondFactor.Contract,
        @Inject(SECOND_FACTOR_QUERIES)
        private readonly secondFactorQueries: Queries.SecondFactor.Contract,
    ) {}

    @Get("list")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SecondFactorListDTO)
    @ApiOperation({ summary: "Get list of second factors" })
    public findMany(
        @Extract.Session() { account }: Extract.Session.Auth,
    ): Promise<[Queries.SecondFactor.Entity[], number]> {
        return this.secondFactorQueries.findMany({ account });
    }

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @FormatResponse(CreateResultDTO)
    @ApiOperation({ summary: "Create TOTP factor" })
    public create(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: CreateBodyDTO,
    ): Promise<Commands.SecondFactor.Create.Result> {
        return this.secondFactorCommands.create({ context, actor, input });
    }

    @Post("confirm")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(ConfirmResultDTO)
    @ApiOperation({ summary: "Confirm TOTP factor" })
    public confirm(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
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
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: PurgeBodyDTO,
    ): Promise<MessageResult> {
        return this.secondFactorCommands.purge({ context, actor, input });
    }

    @Public()
    @Post("reset")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Reset all factors by master code" })
    public reset(@Extract.Meta() context: Extract.Meta, @Body() input: ResetBodyDTO): Promise<MessageResult> {
        return this.secondFactorCommands.reset({ context, input });
    }
}
