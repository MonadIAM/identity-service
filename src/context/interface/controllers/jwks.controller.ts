import { Controller, HttpStatus, HttpCode, Inject, Get, Header } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { JWT_SERVICE } from "~common/services";
import { Public } from "~common/decorators";

const { OK } = HttpStatus;

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
    @ApiOperation({ summary: "Get JSON Web Key Set" })
    @Header("Content-Type", "application/jwk-set+json")
    @Header("Cache-Control", "public, max-age=300, must-revalidate")
    public getJWKS(): Promise<CommonServices.JWT.GetJWKS> {
        return this.jwtService.getJWKS();
    }
}
