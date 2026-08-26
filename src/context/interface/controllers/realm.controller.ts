import { UseInterceptors, Controller, HttpStatus, HttpCode, Delete, Inject, Query, Body } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { RequirePermission, FormatResponse, Swagger, Extract } from "~common/decorators";
import { MEMBERSHIP_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import { ExcludeQueryDTO, ExcludeBodyDTO } from "../dto/realm";

const { REALM_EXCLUDE } = PermissionCode;
const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    BAD_REQUEST,
    FORBIDDEN,
    NOT_FOUND,
    OK,
} = HttpStatus;

@ApiTags("Realm")
@Controller("/realm")
@UseInterceptors(MonitoringInterceptor)
export class RealmController {
    public constructor(
        @Inject(MEMBERSHIP_COMMANDS)
        private readonly membershipCommands: Commands.Membership.ControllerContract,
    ) {}

    @HttpCode(OK)
    @Delete("exclude")
    @RequirePermission(REALM_EXCLUDE)
    @FormatResponse(SuccessMessageDTO)
    @ApiResponse({ status: OK, type: SuccessMessageDTO })
    @ApiOperation({
        summary: "Excludes an account from a realm",
        security: [{ identity: [] }],
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
    )
    public exclude(
        @Query() { realm }: ExcludeQueryDTO,
        @Body() input: ExcludeBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Promise<MessageResult> {
        return this.membershipCommands.exclude({ context, actor, realm, input });
    }
}
