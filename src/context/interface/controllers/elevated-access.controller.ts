import { Controller, HttpStatus, HttpCode, Inject, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, FormatResponse } from "~common/decorators";
import { ELEVATED_ACCESS_HANDLER } from "~context/application/handlers";
import { SuccessMessageDTO } from "~common/dto";

import { BySecondFactorBodyDTO, ByPasswordBodyDTO } from "../dto/elevated-access";

@ApiTags("Elevated Access")
@Controller("/elevated-access")
export class ElevatedAccessController {
    public constructor(
        @Inject(ELEVATED_ACCESS_HANDLER)
        private readonly elevatedAccessHandler: Handlers.ElevatedAccess.Contract,
    ) {}

    @Post("password")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Confirm identity by password" })
    public byPassword(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: ByPasswordBodyDTO,
    ): Promise<MessageResult> {
        return this.elevatedAccessHandler.byPassword({ context, actor, input });
    }

    @Post("second-factor")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Confirm identity by TOTP" })
    public bySecondFactor(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: BySecondFactorBodyDTO,
    ): Promise<MessageResult> {
        return this.elevatedAccessHandler.bySecondFactor({ context, actor, input });
    }
}
