import { Controller, HttpStatus, HttpCode, Header, Inject, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { FormatResponse, Public, Swagger } from "~common/decorators";
import { JWT_SERVICE } from "~common/services";

import { OAUTH_QUERIES } from "../queries";
import { AuthzServerMetadataDTO, OpenIdConfigurationDTO } from "../dto/oauth";

const { INTERNAL_SERVER_ERROR, OK } = HttpStatus;

@ApiTags("Discovery")
@Controller(".well-known")
export class DiscoveryController {
    public constructor(
        @Inject(OAUTH_QUERIES)
        private readonly oauthQueries: Queries.OAuth.ControllerContract,
        @Inject(JWT_SERVICE)
        private readonly jwtService: CommonServices.JWT.PublicContract,
    ) {}

    @Public()
    @HttpCode(OK)
    @Get("oauth-authorization-server")
    @FormatResponse(AuthzServerMetadataDTO)
    @Header("Content-Type", "application/json")
    @Header("Cache-Control", "public, max-age=300")
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR)
    @ApiResponse({ status: OK, type: AuthzServerMetadataDTO })
    @ApiOperation({
        summary: "Get authorization server metadata",
        description: "Authorization server metadata per RFC 8414 §3.",
        security: [],
    })
    public getAuthorizationServerMetadata(): Queries.OAuth.AuthorizationServerMetadata.Result {
        return this.oauthQueries.getAuthorizationServerMetadata();
    }

    @Public()
    @HttpCode(OK)
    @Get("openid-configuration")
    @FormatResponse(OpenIdConfigurationDTO)
    @Header("Content-Type", "application/json")
    @Header("Cache-Control", "public, max-age=300")
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR)
    @ApiResponse({ status: OK, type: OpenIdConfigurationDTO })
    @ApiOperation({
        summary: "Get OpenID Provider configuration",
        description: "OpenID Provider metadata per OpenID Connect Discovery 1.0 §3.",
        security: [],
    })
    public getOpenIdConfiguration(): Queries.OAuth.OpenIdConfiguration.Result {
        return this.oauthQueries.getOpenIdConfiguration();
    }

    @Public()
    @HttpCode(OK)
    @Get("jwks.json")
    @Header("Content-Type", "application/jwk-set+json")
    @Header("Cache-Control", "public, max-age=30, must-revalidate")
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR)
    @ApiOperation({
        summary: "Get JSON Web Key Set",
        description:
            "Publishes verification keys as a JWK Set (RFC 7517), using JWA algorithm identifiers (RFC 7518, ES256) for keys used in JWS-signed tokens (RFC 7515).",
        security: [],
    })
    public getJWKS(): CommonServices.JWT.GetJWKS.Result {
        return this.jwtService.getJWKS();
    }
}
