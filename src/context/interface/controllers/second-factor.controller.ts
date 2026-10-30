import { Controller, HttpStatus, HttpCode, Delete, Header, Inject, Query, Body, Post, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { PermissionCode, ReauthenticationMethod } from "~context/enums";
import { SECOND_FACTOR_COMMANDS } from "~context/application/commands";
import { SECOND_FACTOR_QUERIES } from "~context/application/queries";
import { SuccessMessageDTO } from "~common/dto";
import {
    RequirePermission,
    SensitiveThrottle,
    Reauthentication,
    FormatResponse,
    Swagger,
    Extract,
    Public,
} from "~common/decorators";

import {
    ResetCurrentBodyDTO,
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
    FORBIDDEN,
    CONFLICT,
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
    @ApiOperation({
        summary: "Get list of second factors",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, FORBIDDEN)
    public getList(@Extract.Session() { account }: Extract.Session.Auth): Queries.SecondFactor.FindMany.Result {
        return this.secondFactorQueries.findMany({ account });
    }

    @Get("qr")
    @HttpCode(OK)
    @Header("Pragma", "no-cache")
    @Header("Cache-Control", "no-store")
    @FormatResponse(GetQRCodeResultDTO)
    @RequirePermission(SECOND_FACTOR_READ_PERSONAL)
    @ApiOperation({
        summary: "Get QR code URI for unconfirmed TOTP factor",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, NOT_FOUND, FORBIDDEN)
    public getQRCode(
        @Query() { id }: GetQRCodeQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
    ): Queries.SecondFactor.GetQRCode.Result {
        return this.secondFactorQueries.getQRCode({ id, actor });
    }

    @Post("create")
    @HttpCode(CREATED)
    @Header("Pragma", "no-cache")
    @Header("Cache-Control", "no-store")
    @FormatResponse(CreateResultDTO)
    @RequirePermission(SECOND_FACTOR_CREATE)
    @ApiOperation({
        summary: "Create TOTP factor",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        NOT_FOUND,
        FORBIDDEN,
        CONFLICT,
    )
    public create(
        @Body() input: CreateBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.SecondFactor.Create.Result {
        return this.secondFactorCommands.create({ context, actor, input });
    }

    @HttpCode(OK)
    @Post("verify")
    @Header("Pragma", "no-cache")
    @Header("Cache-Control", "no-store")
    @FormatResponse(VerifyResultDTO)
    @RequirePermission(SECOND_FACTOR_VERIFY)
    @ApiOperation({
        summary: "Verify TOTP factor",
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
        CONFLICT,
    )
    public verify(
        @Body() input: VerifyBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.SecondFactor.Verify.Result {
        return this.secondFactorCommands.verify({ context, actor, input });
    }

    @HttpCode(OK)
    @Delete("purge")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(SECOND_FACTOR_PURGE)
    @Reauthentication({ methods: [ReauthenticationMethod.TOTP], sameFactor: true })
    @ApiOperation({
        summary: "Purge second factor after reauthentication with the same TOTP factor",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        NOT_FOUND,
        FORBIDDEN,
        CONFLICT,
    )
    public purge(
        @Query() input: PurgeQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.SecondFactor.Purge.Result {
        return this.secondFactorCommands.purge({ context, actor, input });
    }

    @HttpCode(OK)
    @Delete("purge/unconfirmed")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(SECOND_FACTOR_PURGE)
    @ApiOperation({
        summary: "Purge unconfirmed second factor",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        NOT_FOUND,
        FORBIDDEN,
        CONFLICT,
    )
    public purgeUnconfirmed(
        @Query() input: PurgeQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.SecondFactor.Purge.Result {
        return this.secondFactorCommands.purge({ context, actor, input: { ...input, confirmedAt: null } });
    }

    @Public()
    @HttpCode(OK)
    @Post("reset")
    @FormatResponse(SuccessMessageDTO)
    @SensitiveThrottle.HighImpactSecret()
    @ApiOperation({
        summary: "Reset all second factors by master code",
        security: [],
    })
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

    @HttpCode(OK)
    @Post("reset/current")
    @FormatResponse(SuccessMessageDTO)
    @RequirePermission(SECOND_FACTOR_PURGE)
    @SensitiveThrottle.HighImpactSecret()
    @ApiOperation({
        summary: "Reset all second factors of the current account by master code",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
        CONFLICT,
    )
    public resetCurrent(
        @Body() { code }: ResetCurrentBodyDTO,
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.SecondFactor.Reset.Result {
        return this.secondFactorCommands.reset({ context, actor, input: { account: actor, code } });
    }
}
