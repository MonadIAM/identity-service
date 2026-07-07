import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
    UseInterceptors,
    Controller,
    HttpStatus,
    HttpCode,
    Inject,
    Delete,
    Patch,
    Query,
    Body,
    Post,
    Get,
} from "@nestjs/common";

import { Extract, FormatResponse, Swagger } from "~common/decorators";
import { OAUTH_CLIENT_COMMANDS } from "~context/application/commands";
import { OAUTH_CLIENT_QUERIES } from "~context/application/queries";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";
// import { PermissionCode } from "~context/enums";

import {
    GetByIdQueryDTO,
    GetListQueryDTO,
    RestoreQueryDTO,
    GetListBodyDTO,
    RestoreBodyDTO,
    RevokeQueryDTO,
    UpdateQueryDTO,
    CreateQueryDTO,
    OAuthClientDTO,
    CreateBodyDTO,
    UpdateBodyDTO,
    RevokeBodyDTO,
    PurgeQueryDTO,
    PurgeBodyDTO,
    ListDTO,
} from "../dto/oauth-client";

// const {
//     OAUTH_CLIENT_READ_ABSOLUTE,
//     OAUTH_CLIENT_CREATE,
//     OAUTH_CLIENT_UPDATE,
//     OAUTH_CLIENT_REVOKE,
//     OAUTH_CLIENT_RESTORE,
//     OAUTH_CLIENT_PURGE,
// } = PermissionCode;
const {
    INTERNAL_SERVER_ERROR,
    UNPROCESSABLE_ENTITY,
    SERVICE_UNAVAILABLE,
    REQUEST_TIMEOUT,
    UNAUTHORIZED,
    BAD_REQUEST,
    FORBIDDEN,
    NOT_FOUND,
    CONFLICT,
    CREATED,
    OK,
} = HttpStatus;

@ApiTags("OAuthClient")
@Controller("/oauth-client")
@UseInterceptors(MonitoringInterceptor)
export class OAuthClientController {
    public constructor(
        @Inject(OAUTH_CLIENT_COMMANDS)
        private readonly oauthClientCommands: Commands.OAuthClient.ControllerContract,
        @Inject(OAUTH_CLIENT_QUERIES)
        private readonly oauthClientQueries: Queries.OAuthClient.ControllerContract,
    ) {}

    @Get()
    @HttpCode(OK)
    @FormatResponse(OAuthClientDTO)
    @ApiResponse({ status: OK, type: OAuthClientDTO })
    // @RequirePermission(OAUTH_CLIENT_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get OAuth client by ID",
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
    )
    public findUnique(@Query() { client, realm, view, mode }: GetByIdQueryDTO): Queries.OAuthClient.FindUnique.Result {
        return this.oauthClientQueries.findUnique({ client, realm, view, mode });
    }

    @Post("list")
    @HttpCode(OK)
    @FormatResponse(ListDTO)
    @ApiResponse({ status: OK, type: ListDTO })
    // @RequirePermission(OAUTH_CLIENT_READ_ABSOLUTE)
    @ApiOperation({
        summary: "Get paginated list of OAuth clients in realm",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        FORBIDDEN,
    )
    public findMany(
        @Body() { pagination, filters, sort }: GetListBodyDTO,
        @Query() { realm, view, mode }: GetListQueryDTO,
    ): Queries.OAuthClient.FindMany.Result {
        return this.oauthClientQueries.findMany({ pagination, filters, realm, sort, view, mode });
    }

    @Post("create")
    @HttpCode(CREATED)
    @FormatResponse(SuccessMessageDTO)
    // @RequirePermission(OAUTH_CLIENT_CREATE)
    @ApiOperation({
        summary: "Create OAuth client",
        security: [{ identity: [] }],
    })
    @Swagger.Exceptions(
        INTERNAL_SERVER_ERROR,
        UNPROCESSABLE_ENTITY,
        SERVICE_UNAVAILABLE,
        REQUEST_TIMEOUT,
        UNAUTHORIZED,
        BAD_REQUEST,
        FORBIDDEN,
        CONFLICT,
    )
    public create(
        @Body() input: CreateBodyDTO,
        @Query() { realm }: CreateQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.OAuthClient.Create.Result {
        return this.oauthClientCommands.create({ context, actor, realm, input });
    }

    @Patch("update")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    // @RequirePermission(OAUTH_CLIENT_UPDATE)
    @ApiOperation({
        summary: "Update OAuth client",
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
    public update(
        @Body() input: UpdateBodyDTO,
        @Query() { realm }: UpdateQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.OAuthClient.Update.Result {
        return this.oauthClientCommands.update({ context, actor, realm, input });
    }

    @Post("revoke")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    // @RequirePermission(OAUTH_CLIENT_REVOKE)
    @ApiOperation({
        summary: "Revoke OAuth client",
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
    public revoke(
        @Body() input: RevokeBodyDTO,
        @Query() { realm }: RevokeQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.OAuthClient.Revoke.Result {
        return this.oauthClientCommands.revoke({ context, actor, realm, input });
    }

    @Post("restore")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    // @RequirePermission(OAUTH_CLIENT_RESTORE)
    @ApiOperation({
        summary: "Restore OAuth client",
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
    public restore(
        @Body() input: RestoreBodyDTO,
        @Query() { realm }: RestoreQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.OAuthClient.Restore.Result {
        return this.oauthClientCommands.restore({ context, actor, realm, input });
    }

    @Delete("purge")
    @HttpCode(OK)
    @FormatResponse(SuccessMessageDTO)
    // @RequirePermission(OAUTH_CLIENT_PURGE)
    @ApiOperation({
        summary: "Purge OAuth client",
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
    public purge(
        @Body() input: PurgeBodyDTO,
        @Query() { realm }: PurgeQueryDTO,
        @Extract.Session() { account: actor }: Extract.Session.Authenticated,
        @Extract.Meta() context: Extract.Meta,
    ): Commands.OAuthClient.Purge.Result {
        return this.oauthClientCommands.purge({ context, actor, realm, input });
    }
}
