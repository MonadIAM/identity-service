import { Controller, HttpStatus, HttpCode, Inject, Body, Post, UseInterceptors } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ELEVATED_ACCESS_HANDLER } from "~context/application/handlers";
import { Extract, FormatResponse } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";

import { BySecondFactorBodyDTO, ByPasswordBodyDTO } from "../dto/elevated-access";

const { OK } = HttpStatus;

@ApiTags("Elevated Access")
@Controller("/elevated-access")
@UseInterceptors(MonitoringInterceptor)
export class ElevatedAccessController {
    public constructor(
        @Inject(ELEVATED_ACCESS_HANDLER)
        private readonly elevatedAccessHandler: Handlers.ElevatedAccess.Contract,
    ) {}

    @HttpCode(OK)
    @Post("password")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Confirm identity by password" })
    public byPassword(
        @Body() input: ByPasswordBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.elevatedAccessHandler.byPassword({ context, actor, input });
    }

    @HttpCode(OK)
    @Post("second-factor")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Confirm identity by TOTP" })
    public bySecondFactor(
        @Body() input: BySecondFactorBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.elevatedAccessHandler.bySecondFactor({ context, actor, input });
    }
}
