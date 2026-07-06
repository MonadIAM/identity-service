import { Controller, HttpStatus, HttpCode, Inject, Get, Header } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Public, Swagger } from "~common/decorators";
import { JWT_SERVICE } from "~common/services";

const { INTERNAL_SERVER_ERROR, OK } = HttpStatus;

@ApiTags("JWKS")
@Controller(".well-known")
export class JWKSController {
    public constructor(
        @Inject(JWT_SERVICE)
        private readonly jwtService: CommonServices.JWT.Contract,
    ) {}

    @Public()
    @HttpCode(OK)
    @Get("jwks.json")
    @Swagger.Exceptions(INTERNAL_SERVER_ERROR)
    @Header("Content-Type", "application/jwk-set+json")
    @Header("Cache-Control", "public, max-age=30, must-revalidate")
    @ApiOperation({
        summary: "Get JSON Web Key Set",
        description:
            "Publishes verification keys as a JWK Set (RFC 7517), using JWA algorithm identifiers (RFC 7518, ES256) for keys used in JWS-signed tokens (RFC 7515).",
        security: [],
    })
    public getJWKS(): Promise<CommonServices.JWT.GetJWKS> {
        return this.jwtService.getJWKS();
    }
}
