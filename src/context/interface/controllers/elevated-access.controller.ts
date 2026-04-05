import { Controller, HttpStatus, HttpCode, Inject, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ExtractSession, ExtractContext, FormatResponse } from "~common/decorators";
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
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() input: ByPasswordBodyDTO,
    ): Promise<MessageResult> {
        return this.elevatedAccessHandler.byPassword({ context, actor, input });
    }

    @Post("second-factor")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Confirm identity by TOTP" })
    public bySecondFactor(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() input: BySecondFactorBodyDTO,
    ): Promise<MessageResult> {
        return this.elevatedAccessHandler.bySecondFactor({ context, actor, input });
    }
}
