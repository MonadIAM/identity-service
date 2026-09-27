import { SwaggerModule, DocumentBuilder, OpenAPIObject, ApiOkResponse } from "@nestjs/swagger";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { Controller, Get, HttpStatus, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { OAUTH_EXCEPTION_EXAMPLES } from "~common/exceptions/oauth-exception.examples";
import { EXCEPTION_EXAMPLES } from "~common/exceptions/exception.examples";

import { Swagger } from "./swagger.decorators";

@Controller("documented")
@Swagger.Exceptions(HttpStatus.UNAUTHORIZED)
class DocumentedController {
    @Get("specific")
    @ApiOkResponse()
    @Swagger.Exceptions(HttpStatus.FORBIDDEN, HttpStatus.CONFLICT)
    public specific(): void {}

    @Get("inherited")
    public inherited(): void {}

    @Get("empty")
    @Swagger.Exceptions()
    public empty(): void {}
}

@Controller("plain")
class PlainController {
    @Get()
    public handle(): void {}
}

@Controller("oauth")
@Swagger.OAuthExceptions(HttpStatus.BAD_REQUEST)
class OAuthController {
    @Get()
    @Swagger.OAuthExceptions(HttpStatus.UNAUTHORIZED)
    public handle(): void {}
}

@Module({ controllers: [DocumentedController, PlainController, OAuthController] })
class SwaggerTestModule {}

describe("Swagger.Exceptions OpenAPI contract", () => {
    let app: NestFastifyApplication;
    let document: OpenAPIObject;

    beforeAll(async () => {
        app = await NestFactory.create<NestFastifyApplication>(SwaggerTestModule, new FastifyAdapter(), { logger: false });
        await app.init();
        document = SwaggerModule.createDocument(
            app,
            new DocumentBuilder().setTitle("Decorator contract").setVersion("1").build(),
        );
    });

    afterAll(async () => {
        await app?.close();
    });

    describe("Exceptions", () => {
        it.each([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN, HttpStatus.CONFLICT] as const)(
            "documents status %s with a resolvable error schema and its example",
            (status) => {
                const response = document.paths["/documented/specific"].get!.responses[status];

                expect(response).toMatchObject({
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ErrorResponseBody" },
                            example: EXCEPTION_EXAMPLES[status],
                        },
                    },
                });
                expect(document.components?.schemas?.ErrorResponseBody).toMatchObject({
                    properties: { statusCode: expect.any(Object), message: expect.any(Object), error: expect.any(Object) },
                });
            },
        );

        it("does not leak handler responses to sibling routes or another controller", () => {
            expect(Object.keys(document.paths["/documented/specific"].get!.responses).sort()).toEqual([
                "200",
                "401",
                "403",
                "409",
            ]);
            expect(Object.keys(document.paths["/documented/inherited"].get!.responses).sort()).toEqual(["200", "401"]);
            expect(Object.keys(document.paths["/plain"].get!.responses)).toEqual(["200"]);
        });

        it("accepts an empty status list without introducing extra error responses", () => {
            expect(Object.keys(document.paths["/documented/empty"].get!.responses).sort()).toEqual(["200", "401"]);
        });
    });

    describe("OAuthExceptions", () => {
        it.each([HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED] as const)("documents OAuth status %s", (status) => {
            const response = document.paths["/oauth"].get!.responses[status];

            expect(response).toMatchObject({
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/OAuthErrorResponseBody" },
                        example: OAUTH_EXCEPTION_EXAMPLES[status],
                    },
                },
            });
            expect(document.components?.schemas?.OAuthErrorResponseBody).toBeDefined();
        });
    });
});
