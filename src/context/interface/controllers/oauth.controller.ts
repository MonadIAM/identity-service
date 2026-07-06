import { ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
    UseInterceptors,
    Controller,
    HttpStatus,
    HttpCode,
    Redirect,
    Header,
    Inject,
    Query,
    Body,
    Post,
    Get,
} from "@nestjs/common";

import { Extract, FormatResponse, Tokens, Public, Swagger } from "~common/decorators";
import { OAUTH_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { BootstrapPipes } from "~bootstrap/pipes.bootstrap";

import { AuthorizeQueryDTO, TokenResultDTO, TokenBodyDTO, RevokeBodyDTO } from "../dto/oauth";

const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    BAD_REQUEST,
    FORBIDDEN,
    CONFLICT,
    FOUND,
    OK,
} = HttpStatus;

@ApiTags("OAuth")
@Controller("/oauth")
@UseInterceptors(MonitoringInterceptor)
export class OAuthController {
    public constructor(
        @Inject(OAUTH_COMMANDS)
        private readonly oauthCommands: Commands.OAuth.ControllerContract,
    ) {}

    @Public()
    @Get("authorize")
    @Redirect(undefined, FOUND)
    @Header("Pragma", "no-cache")
    @Header("Cache-Control", "no-store")
    @ApiOperation({
        summary: "Start OAuth 2.0 Authorization Code flow",
        description:
            "Authorization request per RFC 6749 §4.1.1, with PKCE (RFC 7636) mandatory — S256 only, plain unsupported.",
        security: [],
    })
    @Swagger.OAuthExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST)
    public authorize(@Query(BootstrapPipes.oauthValidationPipe) input: AuthorizeQueryDTO): Commands.OAuth.Authorize.Result {
        return this.oauthCommands.authorize({ input });
    }

    @Public()
    @HttpCode(OK)
    @Post("token")
    @Header("Pragma", "no-cache")
    @Header("Cache-Control", "no-store")
    @Header("Content-Type", "application/json")
    @ApiConsumes("application/x-www-form-urlencoded")
    @FormatResponse(TokenResultDTO)
    @ApiOperation({
        summary: "Exchange a code or refresh token for an access token",
        description: `Authorization Code grant (RFC 6749 §4.1.3) and Refresh Token grant (RFC 6749 §6),
            verifying the PKCE code_verifier (RFC 7636 §4.6) on the authorization_code grant.
            Issues a Bearer-type access token (RFC 6750) as a JWT (RFC 7519) conforming to the OAuth 2.0 Access Token profile (RFC 9068).`,
        security: [],
    })
    @Swagger.OAuthExceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        FORBIDDEN,
        CONFLICT,
    )
    public token(
        @Body(BootstrapPipes.oauthValidationPipe) input: TokenBodyDTO,
        @Extract.Meta() context: Extract.Meta,
        @Tokens.Refresh() refreshToken?: string,
    ): Commands.OAuth.Token.Result {
        return this.oauthCommands.token({
            input: { ...input, refreshToken },
            context,
        });
    }

    @Public()
    @HttpCode(OK)
    @Post("revoke")
    @Header("Pragma", "no-cache")
    @Header("Cache-Control", "no-store")
    @ApiConsumes("application/x-www-form-urlencoded")
    @ApiOperation({
        summary: "Revoke a refresh token",
        description:
            "Token revocation per RFC 7009. Per §2.2, an invalid, expired, or already-revoked token still yields a 200 response; only client-level errors (not found, revoked, realm revoked) are returned as errors.",
        security: [],
    })
    @Swagger.OAuthExceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        FORBIDDEN,
        CONFLICT,
    )
    public revoke(
        @Body(BootstrapPipes.oauthValidationPipe) input: RevokeBodyDTO,
        @Extract.Meta() context: Extract.Meta,
        @Tokens.Refresh() refreshToken?: string,
    ): Commands.OAuth.Revoke.Result {
        return this.oauthCommands.revoke({
            client: input.client,
            refreshToken,
            context,
        });
    }
}
