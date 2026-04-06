import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Patch } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, FormatResponse } from "~common/decorators";
import { PROFILE_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";

import { UpdateBodyDTO } from "../dto/profile";

@ApiTags("Profile")
@Controller("/profile")
@UseInterceptors(MonitoringInterceptor)
export class ProfileController {
    public constructor(
        @Inject(PROFILE_COMMANDS)
        private readonly profileCommands: Commands.Profile.Contract,
    ) {}

    @Patch("update")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Update profile" })
    public update(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: UpdateBodyDTO,
    ): Promise<MessageResult> {
        return this.profileCommands.update({ context, actor, input });
    }
}
