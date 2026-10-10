import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { describe, expect, it, jest } from "@jest/globals";
import { lastValueFrom, of, throwError } from "rxjs";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";

import { SKIP_INTERCEPTORS } from "~common/decorators";

import { PendingTokenInterceptor } from "./pending-token.interceptor";

function setup(options: { skipClass?: boolean; skipHandler?: boolean } = {}): {
    interceptor: PendingTokenInterceptor;
    context: ExecutionContextHost;
    setCookie: ReturnType<typeof jest.fn>;
    run(data: unknown): Promise<unknown>;
} {
    class Controller {}
    const handler = (): void => {};
    const setCookie = jest.fn();
    const context = new ExecutionContextHost([{}, { setCookie }], Controller, handler);
    if (options.skipClass !== undefined) {
        Reflect.defineMetadata(SKIP_INTERCEPTORS, options.skipClass, Controller);
    }
    if (options.skipHandler !== undefined) {
        Reflect.defineMetadata(SKIP_INTERCEPTORS, options.skipHandler, handler);
    }
    const interceptor = new PendingTokenInterceptor(
        new ConfigService({ PENDING_TOKEN_EXPIRY_MINUTES: "5m", API_VERSION: 3 }),
        new Reflector(),
    );
    const run = (data: unknown): Promise<unknown> =>
        lastValueFrom(interceptor.intercept(context, { handle: () => of(data) }));
    return { interceptor, context, setCookie, run };
}

describe("[Interceptor] - PendingToken", () => {
    describe("[Method] - intercept", () => {
        it("[case] - moves the pending token into a protected cookie scoped to the configured 2FA route", async () => {
            // Arrange
            const { run, setCookie } = setup();
            const data = Object.freeze({ pendingToken: "secret-token", requires2FA: true, methods: ["totp"] });

            // Act
            const result = await run(data);

            // Assert
            expect(result).toEqual({ requires2FA: true, methods: ["totp"] });
            expect(result).not.toHaveProperty("pendingToken");
            expect(data.pendingToken).toBe("secret-token");
            expect(setCookie).toHaveBeenCalledTimes(1);
            expect(setCookie).toHaveBeenCalledWith("pending_token", "secret-token", {
                maxAge: 300,
                path: "/api/v3/authn/verify/2fa",
                sameSite: "strict",
                httpOnly: true,
                secure: true,
            });
        });

        it.each([
            { label: "undefined", data: undefined },
            { label: "null", data: null },
            { label: "absent token", data: {} },
            { label: "undefined token", data: { pendingToken: undefined } },
            { label: "null token", data: { pendingToken: null } },
            { label: "numeric token", data: { pendingToken: 123 } },
        ])("[case] - preserves a response without a string token: $label", async ({ data }) => {
            // Arrange
            const { run, setCookie } = setup();

            // Act
            const result = await run(data);

            // Assert
            expect(result).toBe(data);
            expect(setCookie).not.toHaveBeenCalled();
        });

        it("[case] - handles an explicitly empty string according to the string-token contract", async () => {
            // Arrange
            const { run, setCookie } = setup();

            // Act
            const result = await run({ pendingToken: "" });

            // Assert
            expect(result).toEqual({});
            expect(setCookie).toHaveBeenCalledWith("pending_token", "", expect.any(Object));
        });

        it.each([
            { label: "controller", options: { skipClass: true } },
            { label: "handler", options: { skipHandler: true } },
        ])("[case] - preserves the original stream when skipped: $label", ({ options }) => {
            // Arrange
            const { interceptor, context, setCookie } = setup(options);
            const stream = of({ pendingToken: "token" });
            const handle = jest.fn(() => stream);

            // Act
            const result = interceptor.intercept(context, { handle });

            // Assert
            expect(result).toBe(stream);
            expect(handle).toHaveBeenCalledTimes(1);
            expect(setCookie).not.toHaveBeenCalled();
        });

        it("[case] - allows method metadata to override a class-level skip", async () => {
            // Arrange
            const { run, setCookie } = setup({ skipClass: true, skipHandler: false });

            // Act
            const result = await run({ pendingToken: "token", message: "Continue" });

            // Assert
            expect(result).toEqual({ message: "Continue" });
            expect(setCookie).toHaveBeenCalledTimes(1);
        });

        it("[case] - propagates handler errors without setting a cookie", async () => {
            // Arrange
            const { interceptor, context, setCookie } = setup();
            const error = new Error("handler failed");

            // Act
            const result = lastValueFrom(interceptor.intercept(context, { handle: () => throwError(() => error) }));

            // Assert
            await expect(result).rejects.toBe(error);
            expect(setCookie).not.toHaveBeenCalled();
        });

        it("[case] - propagates cookie-writing failures through the observable", async () => {
            // Arrange
            const { run, setCookie } = setup();
            const error = new Error("reply already sent");
            setCookie.mockImplementationOnce(() => {
                throw error;
            });

            // Act
            const result = run({ pendingToken: "token" });

            // Assert
            await expect(result).rejects.toBe(error);
        });
    });
});
