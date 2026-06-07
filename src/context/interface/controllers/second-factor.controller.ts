import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Delete, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, Public, ElevatedAccess, FormatResponse, RequirePermission, Swagger } from "~common/decorators";
import { SECOND_FACTOR_COMMANDS } from "~context/application/commands";
import { SECOND_FACTOR_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
import { PermissionCode } from "~context/enums";

import {
    GetQRCodeResultDTO,
    GetQRCodeQueryDTO,
    VerifyResultDTO,
    CreateResultDTO,
    VerifyBodyDTO,
    CreateBodyDTO,
    PurgeQueryDTO,
    ResetBodyDTO,
    ListDTO,
} from "../dto/second-factor";

const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    BAD_REQUEST,
    NOT_FOUND,
    CONFLICT,
    FORBIDDEN,
    CREATED,
    OK,
} = HttpStatus;
const {
    SECOND_FACTOR_READ_PERSONAL,
    SECOND_FACTOR_READ_ABSOLUTE,
    SECOND_FACTOR_CREATE,
    SECOND_FACTOR_VERIFY,
    SECOND_FACTOR_PURGE,
} = PermissionCode;

@ApiTags("SecondFactor")
@Controller("/second-factor")
@UseInterceptors(MonitoringInterceptor)
export class SecondFactorController {
    public constructor(
        @Inject(SECOND_FACTOR_COMMANDS)
        private readonly secondFactorCommands: Commands.SecondFactor.ControllerContract,
        @Inject(SECOND_FACTOR_QUERIES)
        private readonly secondFactorQueries: Queries.SecondFactor.ControllerContract,
    ) {}

    @Get("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @RequirePermission(SECOND_FACTOR_READ_PERSONAL, SECOND_FACTOR_READ_ABSOLUTE)
    @ApiOperation({ summary: "Get list of second factors" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, FORBIDDEN)
    public getList(@Extract.Session() { account }: Extract.Session.Authenticated): Queries.SecondFactor.FindMany.Result {
        return this.secondFactorQueries.findMany({ account });
    }

    @Get("qr")
    @HttpCode(OK)
    @FormatResponse(GetQRCodeResultDTO)
    @RequirePermission(SECOND_FACTOR_READ_PERSONAL)
    @ApiOperation({ summary: "Get QR code URI for unconfirmed TOTP factor" })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public getQRCode(
        @Query() { id }: GetQRCodeQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
    ): Queries.SecondFactor.GetQRCode.Result {
        return this.secondFactorQueries.getQRCode({ id, actor });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(CreateResultDTO)
    @RequirePermission(SECOND_FACTOR_CREATE)
    @ApiOperation({ summary: "Create TOTP factor" })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        NOT_FOUND,
        CONFLICT,
        FORBIDDEN,
    )
    public create(
        @Body() input: CreateBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.SecondFactor.Create.Result {
        return this.secondFactorCommands.create({ context, actor, input });
    }

    @HttpCode(OK)
    @Post("verify")
    @FormatResponse(VerifyResultDTO)
    @RequirePermission(SECOND_FACTOR_VERIFY)
    @ApiOperation({ summary: "Verify TOTP factor" })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        NOT_FOUND,
        CONFLICT,
        FORBIDDEN,
    )
    public verify(
        @Body() input: VerifyBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.SecondFactor.Verify.Result {
        return this.secondFactorCommands.verify({ context, actor, input });
    }

    @HttpCode(OK)
    @Delete("purge")
    @ElevatedAccess()
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(SECOND_FACTOR_PURGE)
    @ApiOperation({ summary: "Purge non-active factor" })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        NOT_FOUND,
        CONFLICT,
        FORBIDDEN,
    )
    public purge(
        @Query() input: PurgeQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.SecondFactor.Purge.Result {
        return this.secondFactorCommands.purge({ context, actor, input });
    }

    @Public()
    @HttpCode(OK)
    @Post("reset")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Reset all factors by master code" })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        CONFLICT,
    )
    public reset(@Body() input: ResetBodyDTO, @Extract.Meta() context: Extract.Meta): Commands.SecondFactor.Reset.Result {
        return this.secondFactorCommands.reset({ context, input });
    }
}
