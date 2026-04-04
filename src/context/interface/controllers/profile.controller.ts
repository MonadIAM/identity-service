import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ExtractSession, ExtractContext } from "~common/decorators";
import { PROFILE_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";

@ApiTags("Profile")
@Controller("/profile")
@UseInterceptors(MonitoringInterceptor)
export class ProfileController {
    public constructor(
        @Inject(PROFILE_COMMANDS)
        private readonly profileCommands: Commands.Profile.Contract,
    ) {}

    @Post("update")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Update profile" })
    public update(
        @ExtractSession() { account }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() patch: any,
    ) {
        return this.profileCommands.update({ context, actor: account, input: { account, patch } });
    }
}
