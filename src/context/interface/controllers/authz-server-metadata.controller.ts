import { Controller, Header, HttpCode, HttpStatus, Inject, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { OAUTH_QUERIES } from "~context/application/queries";
import { FormatResponse, Public } from "~common/decorators";

import { AuthzServerMetadataDTO } from "../dto/oauth";

const { OK } = HttpStatus;

@ApiTags("OAuth")
@Controller(".well-known")
export class AuthzServerMetadataController {
    public constructor(
        @Inject(OAUTH_QUERIES)
        private readonly oauthQueries: Queries.OAuth.ControllerContract,
    ) {}

    @Public()
    @HttpCode(OK)
    @Get("oauth-authorization-server")
    @FormatResponse(AuthzServerMetadataDTO)
    @Header("Content-Type", "application/json")
    @Header("Cache-Control", "public, max-age=300")
    @ApiResponse({ status: OK, type: AuthzServerMetadataDTO })
    @ApiOperation({
        summary: "Get authorization server metadata",
        description: "Authorization server metadata per RFC 8414 §3.",
        security: [],
    })
    public getAuthorizationServerMetadata(): Queries.OAuth.AuthorizationServerMetadata.Result {
        return this.oauthQueries.getAuthorizationServerMetadata();
    }
}
