import { Controller, HttpStatus, HttpCode, Inject, Body, Patch } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, FormatResponse, RequirePermission, Swagger } from "~common/decorators";
import { PROFILE_COMMANDS } from "~context/application/commands";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import { UpdateBodyDTO } from "../dto/profile";

const { PROFILE_UPDATE } = PermissionCode;
const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    BAD_REQUEST,
    NOT_FOUND,
    FORBIDDEN,
    CONFLICT,
    OK,
} = HttpStatus;

@ApiTags("Profile")
@Controller("/profile")
export class ProfileController {
    public constructor(
        @Inject(PROFILE_COMMANDS)
        private readonly profileCommands: Commands.Profile.ControllerContract,
    ) {}

    @HttpCode(OK)
    @Patch("update")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(PROFILE_UPDATE)
    @ApiOperation({
        security: [{ identity: [] }],
        summary: "Update profile",
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        FORBIDDEN,
        CONFLICT,
    )
    public update(
        @Body() input: UpdateBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.Profile.Update.Result {
        return this.profileCommands.update({ context, actor, input });
    }
}
