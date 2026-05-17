import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Delete, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, Public, ElevatedAccess, FormatResponse } from "~common/decorators";
import { SECOND_FACTOR_COMMANDS } from "~context/application/commands";
import { SECOND_FACTOR_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";

import {
    VerifyResultDTO,
    CreateResultDTO,
    VerifyBodyDTO,
    CreateBodyDTO,
    PurgeQueryDTO,
    ResetBodyDTO,
    ListDTO,
} from "../dto/second-factor";

const { CREATED, OK } = HttpStatus;

@ApiTags("SecondFactor")
@Controller("/second-factor")
@UseInterceptors(MonitoringInterceptor)
export class SecondFactorController {
    public constructor(
        @Inject(SECOND_FACTOR_COMMANDS)
        private readonly secondFactorCommands: Commands.SecondFactor.ControllerContract,
        @Inject(SECOND_FACTOR_QUERIES)
        private readonly secondFactorQueries: Queries.SecondFactor.ControllerContract,
    ) {}

    @Get("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiOperation({ summary: "Get list of second factors" })
    public getList(@Extract.Session() { account }: Extract.Session.Auth): Queries.SecondFactor.FindMany.Result {
        return this.secondFactorQueries.findMany({ account });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(CreateResultDTO)
    @ApiOperation({ summary: "Create TOTP factor" })
    public create(
        @Body() input: CreateBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.SecondFactor.Create.Result {
        return this.secondFactorCommands.create({ context, actor, input });
    }

    @HttpCode(OK)
    @Post("verify")
    @FormatResponse(VerifyResultDTO)
    @ApiOperation({ summary: "Verify TOTP factor" })
    public verify(
        @Body() input: VerifyBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.SecondFactor.Verify.Result {
        return this.secondFactorCommands.verify({ context, actor, input });
    }

    @HttpCode(OK)
    @Delete("purge")
    @ElevatedAccess()
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Purge non-active factor" })
    public purge(
        @Query() input: PurgeQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.SecondFactor.Purge.Result {
        return this.secondFactorCommands.purge({ context, actor, input });
    }

    @Public()
    @HttpCode(OK)
    @Post("reset")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Reset all factors by master code" })
    public reset(@Body() input: ResetBodyDTO, @Extract.Meta() context: Extract.Meta): Commands.SecondFactor.Reset.Result {
        return this.secondFactorCommands.reset({ context, input });
    }
}
