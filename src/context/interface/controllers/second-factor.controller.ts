import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Delete, Patch } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ExtractSession, ExtractContext, Public, ElevatedAccess } from "~common/decorators";
import { SECOND_FACTOR_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";

@ApiTags("Second Factor")
@Controller("/second-factor")
@UseInterceptors(MonitoringInterceptor)
export class SecondFactorController {
    public constructor(
        @Inject(SECOND_FACTOR_COMMANDS)
        private readonly secondFactorCommands: Commands.SecondFactor.Contract,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Create TOTP factor" })
    public create(
        @ExtractSession() { account }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() body: any,
    ) {
        return this.secondFactorCommands.create({
            context,
            actor: account,
            input: { name: body.name },
        });
    }

    @Post("confirm")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Confirm TOTP factor" })
    public confirm(
        @ExtractSession() { account }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() { factor, code }: any,
    ) {
        return this.secondFactorCommands.confirm({
            context,
            actor: account,
            input: { factor, code },
        });
    }

    @Patch("revoke")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Revoke TOTP factor" })
    public revoke(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() { factor }: any,
    ) {
        return this.secondFactorCommands.revoke({ context, actor, input: { factor } });
    }

    @Patch("restore")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Restore revoked factor" })
    public restore(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() { factor }: any,
    ) {
        return this.secondFactorCommands.restore({ context, actor, input: { factor } });
    }

    @Delete("purge")
    @ElevatedAccess()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Purge non-active factor" })
    public purge(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() { factor }: any,
    ) {
        return this.secondFactorCommands.purge({ context, actor, input: { factor } });
    }

    @Public()
    @Post("reset")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Reset all factors by master code" })
    public reset(@ExtractContext() context: RequestContext, @Body() { identifier, code }: any) {
        return this.secondFactorCommands.reset({ context, input: { identifier, code } });
    }
}
