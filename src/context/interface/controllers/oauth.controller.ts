import { ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { type FastifyReply } from "fastify";
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
    Res,
} from "@nestjs/common";

import { Extract, FormatResponse, Public, Swagger } from "~common/decorators";
import { OAUTH_COMMANDS } from "~context/application/commands";
import { OAUTH_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { BootstrapPipes } from "~bootstrap/pipes.bootstrap";

import {
    EndSessionQueryDTO,
    AuthorizeQueryDTO,
    UserInfoResultDTO,
    TokenResultDTO,
    TokenBodyDTO,
    RevokeBodyDTO,
} from "../dto/oauth";

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
        @Inject(OAUTH_QUERIES)
        private readonly oauthQueries: Queries.OAuth.ControllerContract,
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
    ): Commands.OAuth.Token.Result {
        return this.oauthCommands.token({
            context,
            input,
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
    ): Commands.OAuth.Revoke.Result {
        return this.oauthCommands.revoke({
            ...input,
            context,
        });
    }

    @Public()
    @Get("logout")
    @Header("Pragma", "no-cache")
    @Header("Cache-Control", "no-store")
    @ApiOperation({
        summary: "End an OpenID Connect session",
        description:
            "RP-Initiated Logout per OpenID Connect RP-Initiated Logout 1.0 §2. Identifies the session via `id_token_hint`; redirects to `post_logout_redirect_uri` only if it matches the client's registered redirect URI.",
        security: [],
    })
    @Swagger.OAuthExceptions(INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST)
    public endSession(
        @Query(BootstrapPipes.oauthValidationPipe) input: EndSessionQueryDTO,
        @Extract.Meta() context: Extract.Meta,
        @Res({ passthrough: true }) response: FastifyReply,
    ): Commands.OAuth.EndSession.Result {
        return this.oauthCommands.endSession({ input, context, response });
    }

    @HttpCode(OK)
    @Get("userinfo")
    @Header("Pragma", "no-cache")
    @Header("Cache-Control", "no-store")
    @FormatResponse(UserInfoResultDTO)
    @ApiOperation({
        summary: "Get claims about the authenticated end-user",
        description:
            "UserInfo Endpoint per OIDC Core §5.3. Requires an access token issued with the `openid` scope; claims returned depend on which additional scopes (`profile`, `email`) were granted.",
        security: [{ identity: [] }],
    })
    @Swagger.OAuthExceptions(INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE, REQUEST_TIMEOUT, UNAUTHORIZED, FORBIDDEN)
    public getUserInfo(@Extract.Session() { account, client, scope }: Extract.Session.Auth): Queries.OAuth.UserInfo.Result {
        return this.oauthQueries.getUserInfo({ account, client, scope });
    }
}
