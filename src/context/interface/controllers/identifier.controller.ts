import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Patch, Delete } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { ExtractSession, ExtractContext, ElevatedAccess } from "~common/decorators";
import { IDENTIFIER_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";

@ApiTags("Identifier")
@Controller("/identifier")
@UseInterceptors(MonitoringInterceptor)
export class IdentifierController {
    public constructor(
        @Inject(IDENTIFIER_COMMANDS)
        private readonly identifierCommands: Commands.Identifier.Contract,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Add identifier" })
    public create(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() { identifier, type }: any,
    ) {
        return this.identifierCommands.create({
            input: { identifier, type },
            context,
            actor,
        });
    }

    @Post("resend")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Resend identifier verification" })
    public resend(@ExtractSession() { account: actor }: SessionContext, @Body() { identifier }: any) {
        return this.identifierCommands.resend({ actor, input: { identifier } });
    }

    @Post("confirm")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Confirm identifier" })
    public confirm(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() { code }: any,
    ) {
        return this.identifierCommands.confirm({ context, actor, input: { code } });
    }

    @Patch("toggle/notifications")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Toggle notifications" })
    public toggleNotifications(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() { identifier }: any,
    ) {
        return this.identifierCommands.toggleNotifications({
            input: { identifier },
            context,
            actor,
        });
    }

    @Patch("toggle/public-contact")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Toggle notifications" })
    public togglePublicContact(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() { identifier }: any,
    ) {
        return this.identifierCommands.togglePublicContact({
            input: { identifier },
            context,
            actor,
        });
    }

    @Delete("purge")
    @ElevatedAccess()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Remove identifier" })
    public purge(
        @ExtractSession() { account: actor }: SessionContext,
        @ExtractContext() context: RequestContext,
        @Body() { identifier }: any,
    ) {
        return this.identifierCommands.purge({
            input: { identifier },
            context,
            actor,
        });
    }
}
