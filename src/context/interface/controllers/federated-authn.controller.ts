import { UseInterceptors, Controller, HttpStatus, HttpCode, Header, Inject, Query, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { FEDERATED_AUTHN_COMMANDS } from "~context/application/commands";
import { Extract, Public, Swagger } from "~common/decorators";
import { MonitoringInterceptor } from "~common/interceptors";

import { FederatedAuthorizeQueryDTO, FederatedCallbackQueryDTO } from "../dto/federated-authn";

const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    BAD_REQUEST,
    BAD_GATEWAY,
    CONFLICT,
    OK,
} = HttpStatus;

@ApiTags("FederatedAuthn")
@Controller("/authn/federated")
@UseInterceptors(MonitoringInterceptor)
export class FederatedAuthnController {
    public constructor(
        @Inject(FEDERATED_AUTHN_COMMANDS)
        private readonly federatedAuthnCommands: Commands.FederatedAuthn.ControllerContract,
    ) {}

    @Public()
    @HttpCode(OK)
    @Get("authorize")
    @ApiOperation({
        summary: "Get federated authentication URL",
        security: [],
    })
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST)
    public authorize(@Query() input: FederatedAuthorizeQueryDTO): Commands.FederatedAuthn.Authorize.Result {
        return this.federatedAuthnCommands.authorize({ input });
    }

    @Public()
    @HttpCode(OK)
    @Get("callback")
    @Header("Pragma", "no-cache")
    @Header("Cache-Control", "no-store")
    @ApiOperation({
        summary: "Handle federated authentication callback",
        security: [],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        BAD_GATEWAY,
        CONFLICT,
    )
    public callback(
        @Query() input: FederatedCallbackQueryDTO,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.FederatedAuthn.Callback.Result {
        return this.federatedAuthnCommands.callback({ context, input });
    }
}
