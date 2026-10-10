import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { validate, ValidationError } from "class-validator";
import { Logger } from "@nestjs/common";

import { IsNotPwned } from "./is-not-pwned.validator";

const suffix = "1E4C9B93F3F0682250B6CF8331B7EE68FD8";
const rangeUrl = "https://hibp.example.test/range/";

class Input {
    @IsNotPwned()
    public password!: unknown;
}

function check(value: unknown): Promise<ValidationError[]> {
    return validate(Object.assign(new Input(), { password: value }));
}

describe("[Validator] - IsNotPwned", () => {
    let request: jest.SpiedFunction<typeof fetch>;
    let warn: jest.SpiedFunction<Logger["warn"]>;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.replaceProperty(process, "env", {
            ...process.env,
            HIBP_REQUEST_TIMEOUT: "2s",
            HIBP_RANGE_URL: rangeUrl,
        });
        request = jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Unexpected HTTP request"));
        warn = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe("[Method] - validate", () => {
        it("[case] - sends only the uppercase five-character hash prefix and requests padding", async () => {
            // Arrange
            request.mockResolvedValueOnce(new Response("OTHER:42\r\n"));

            // Act
            const errors = await check("password");
            const result = jest.getTimerCount();

            // Assert
            expect(errors).toEqual([]);
            expect(request).toHaveBeenCalledTimes(1);
            expect(request).toHaveBeenCalledWith(`${rangeUrl}5BAA6`, {
                headers: { "Add-Padding": "true" },
                signal: expect.any(AbortSignal),
            });
            expect(warn).not.toHaveBeenCalled();
            expect(result).toBe(0);
        });

        it("[case] - rejects a breached password and supplies the default validation message", async () => {
            // Arrange
            request.mockResolvedValueOnce(new Response(`OTHER:4\r\n${suffix}:123\r\n`));

            // Act
            const errors = await check("password");
            const result = jest.getTimerCount();

            // Assert
            expect(errors).toHaveLength(1);
            expect(errors[0].constraints).toEqual({
                IsNotPwned: 'Field "password" has appeared in a known password breach (Have I Been Pwned).',
            });
            expect(result).toBe(0);
            expect(warn).not.toHaveBeenCalled();
        });

        it("[case] - ignores a padding entry with a zero occurrence count", async () => {
            // Arrange
            request.mockResolvedValueOnce(new Response(`${suffix}:0\r\nOTHER:10`));

            // Act
            const errors = await check("password");

            // Assert
            expect(errors).toEqual([]);
        });

        it.each([
            { label: "null", value: null },
            { label: "undefined", value: undefined },
            { label: "number", value: 123 },
            { label: "boolean", value: false },
            { label: "object", value: {} },
            { label: "array", value: [] },
        ])("[case] - leaves non-string input $label to other validators", async ({ value }) => {
            // Arrange

            // Act
            const errors = await check(value);
            const result = jest.getTimerCount();

            // Assert
            expect(errors).toEqual([]);
            expect(request).not.toHaveBeenCalled();
            expect(result).toBe(0);
        });

        it.each([429, 503])("[case] - fails open on HTTP %s and clears the timeout", async (status) => {
            // Arrange
            request.mockResolvedValueOnce(new Response("unavailable", { status }));

            // Act
            const errors = await check("password");
            const result = jest.getTimerCount();

            // Assert
            expect(errors).toEqual([]);
            expect(warn).toHaveBeenCalledWith(`HIBP range lookup returned ${status} — failing open for this check.`);
            expect(result).toBe(0);
        });

        it.each([
            { error: new Error("network unavailable"), message: "network unavailable" },
            { error: "unexpected rejection", message: "unknown error" },
        ])("[case] - fails open on transport rejection: $message", async ({ error, message }) => {
            // Arrange
            request.mockRejectedValueOnce(error);

            // Act
            const errors = await check("password");
            const result = jest.getTimerCount();

            // Assert
            expect(errors).toEqual([]);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining(`lookup failed (${message})`));
            expect(result).toBe(0);
        });

        it("[case] - fails open if reading the response body fails", async () => {
            // Arrange
            const response = new Response();
            jest.spyOn(response, "text").mockRejectedValueOnce(new Error("body interrupted"));
            request.mockResolvedValueOnce(response);

            // Act
            const errors = await check("password");
            const result = jest.getTimerCount();

            // Assert
            expect(errors).toEqual([]);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining("body interrupted"));
            expect(result).toBe(0);
        });

        it("[case] - aborts at the configured timeout and completes validation without hanging", async () => {
            // Arrange
            request.mockImplementation(
                (_url, options) =>
                    new Promise((_resolve, reject) => {
                        options!.signal!.addEventListener("abort", () => reject(new Error("request aborted")), {
                            once: true,
                        });
                    }),
            );

            // Act
            const pending = check("password");
            const signal = request.mock.calls[0][1]!.signal!;
            await jest.advanceTimersByTimeAsync(1999);
            const abortedBeforeTimeout = signal.aborted;
            await jest.advanceTimersByTimeAsync(1);
            const errors = await pending;
            const timersAfterTimeout = jest.getTimerCount();

            // Assert
            expect(abortedBeforeTimeout).toBe(false);
            expect(signal.aborted).toBe(true);
            expect(errors).toEqual([]);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining("request aborted"));
            expect(timersAfterTimeout).toBe(0);
        });

        it("[case] - respects custom validation options", async () => {
            // Arrange
            class CustomInput {
                @IsNotPwned({ message: "Choose another password", context: { fieldCode: "password" } })
                public password = "password";
            }
            request.mockResolvedValueOnce(new Response(`${suffix}:1`));

            // Act
            const errors = await validate(new CustomInput());

            // Assert
            expect(errors[0].constraints).toEqual({ IsNotPwned: "Choose another password" });
            expect(errors[0].contexts).toEqual({ IsNotPwned: { fieldCode: "password" } });
        });
    });
});
