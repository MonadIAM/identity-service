import { Controller, HttpStatus, HttpCode, Inject, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ExtractSession, ExtractContext } from "~common/decorators";
import { ELEVATED_ACCESS_HANDLER } from "~context/application/handlers";

@ApiTags("Elevated Access")
@Controller("/elevated-access")
export class ElevatedAccessController {
    public constructor(
        @Inject(ELEVATED_ACCESS_HANDLER)
        private readonly elevatedAccessHandler: Handlers.ElevatedAccess.Contract,
    ) {}

    @Post("password")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Confirm identity by password" })
    public byPassword(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() input: { password: string },
    ) {
        return this.elevatedAccessHandler.byPassword({ context, actor, input });
    }

    @Post("totp")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Confirm identity by TOTP" })
    public byTOTP(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() input: { code: string },
    ) {
        return this.elevatedAccessHandler.byTOTP({ context, actor, input });
    }
}
