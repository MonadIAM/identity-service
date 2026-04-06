import { UseInterceptors, Controller, HttpStatus, HttpCode, Inject, Body, Post, Patch, Delete } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Extract, ElevatedAccess, FormatResponse } from "~common/decorators";
import { IDENTIFIER_COMMANDS } from "~context/application/commands";
import { MonitoringInterceptor } from "~common/interceptors";
import { SuccessMessageDTO } from "~common/dto";

import {
    ToggleNotificationsBodyDTO,
    TogglePublicContactBodyDTO,
    CreateIdentifierBodyDTO,
    PurgeIdentifierBodyDTO,
    ConfirmTOTPBodyDTO,
    ResendTOTPBodyDTO,
} from "../dto/identifier";

@ApiTags("Identifier")
@Controller("/identifier")
@UseInterceptors(MonitoringInterceptor)
export class IdentifierController {
    public constructor(
        @Inject(IDENTIFIER_COMMANDS)
        private readonly identifierCommands: Commands.Identifier.Contract,
    ) {}

    @Post("create")
    @HttpCode(HttpStatus.CREATED)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Add identifier" })
    public create(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: CreateIdentifierBodyDTO,
    ): Promise<MessageResult> {
        return this.identifierCommands.create({ context, actor, input });
    }

    @Post("resend")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Resend identifier verification" })
    public resend(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Body() input: ResendTOTPBodyDTO,
    ): Promise<MessageResult> {
        return this.identifierCommands.resend({ actor, input });
    }

    @Post("confirm")
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Confirm identifier" })
    public confirm(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: ConfirmTOTPBodyDTO,
    ): Promise<MessageResult> {
        return this.identifierCommands.confirm({ context, actor, input });
    }

    @HttpCode(HttpStatus.OK)
    @Patch("toggle/notifications")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Toggle notifications" })
    public toggleNotifications(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: ToggleNotificationsBodyDTO,
    ): Promise<MessageResult> {
        return this.identifierCommands.toggleNotifications({ context, actor, input });
    }

    @HttpCode(HttpStatus.OK)
    @Patch("toggle/public-contact")
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Toggle notifications" })
    public togglePublicContact(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: TogglePublicContactBodyDTO,
    ): Promise<MessageResult> {
        return this.identifierCommands.togglePublicContact({ context, actor, input });
    }

    @Delete("purge")
    @ElevatedAccess()
    @HttpCode(HttpStatus.OK)
    @FormatResponse(SuccessMessageDTO)
    @ApiOperation({ summary: "Remove identifier" })
    public purge(
        @Extract.Session() { account: actor }: Extract.Session.Auth,
        @Extract.Meta() context: Extract.Meta,
        @Body() input: PurgeIdentifierBodyDTO,
    ): Promise<MessageResult> {
        return this.identifierCommands.purge({ context, actor, input });
    }
}
