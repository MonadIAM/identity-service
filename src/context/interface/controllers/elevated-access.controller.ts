import { Controller, HttpStatus, HttpCode, Inject, Body, Post, UseInterceptors } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, FormatResponse, RequirePermission, Swagger } from "~common/decorators";
import { ELEVATED_ACCESS_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import { BySecondFactorBodyDTO, ByPasswordBodyDTO } from "../dto/elevated-access";

const { INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, OK } = HttpStatus;
const { ELEVATED_ACCESS_CONFIRM_SECOND_FACTOR, ELEVATED_ACCESS_CONFIRM_PASSWORD } = PermissionCode;

@ApiTags("ElevatedAccess")
@Controller("/elevated-access")
@UseInterceptors(MonitoringInterceptor)
export class ElevatedAccessController {
    public constructor(
        @Inject(ELEVATED_ACCESS_COMMANDS)
        private readonly elevatedAccessCommands: Commands.ElevatedAccess.ControllerContract,
    ) {}

    @HttpCode(OK)
    @Post("password")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(ELEVATED_ACCESS_CONFIRM_PASSWORD)
    @ApiOperation({ summary: "Confirm identity by password" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
    public byPassword(
        @Body() input: ByPasswordBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.ElevatedAccess.ByPassword.Result {
        return this.elevatedAccessCommands.byPassword({ context, actor, input });
    }

    @HttpCode(OK)
    @Post("second-factor")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Confirm identity by TOTP" })
    @RequirePermission(ELEVATED_ACCESS_CONFIRM_SECOND_FACTOR)
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
    public bySecondFactor(
        @Body() input: BySecondFactorBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.ElevatedAccess.BySecondFactor.Result {
        return this.elevatedAccessCommands.bySecondFactor({ context, actor, input });
    }
}
