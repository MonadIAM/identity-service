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

describe("IsNotPwned", () => {
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

    it("sends only the uppercase five-character hash prefix and requests padding", async () => {
        request.mockResolvedValueOnce(new Response("OTHER:42\r\n"));

        const errors = await check("password");

        expect(errors).toEqual([]);
        expect(request).toHaveBeenCalledTimes(1);
        expect(request).toHaveBeenCalledWith(`${rangeUrl}5BAA6`, {
            headers: { "Add-Padding": "true" },
            signal: expect.any(AbortSignal),
        });
        expect(warn).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(0);
    });

    it("rejects a breached password and supplies the default validation message", async () => {
        request.mockResolvedValueOnce(new Response(`OTHER:4\r\n${suffix}:123\r\n`));

        const errors = await check("password");

        expect(errors).toHaveLength(1);
        expect(errors[0].constraints).toEqual({
            IsNotPwned: 'Field "password" has appeared in a known password breach (Have I Been Pwned).',
        });
        expect(jest.getTimerCount()).toBe(0);
        expect(warn).not.toHaveBeenCalled();
    });

    it("ignores a padding entry with a zero occurrence count", async () => {
        request.mockResolvedValueOnce(new Response(`${suffix}:0\r\nOTHER:10`));

        const errors = await check("password");

        expect(errors).toEqual([]);
    });

    it.each([null, undefined, 123, false, {}, []])("leaves non-string input %j to other validators", async (value) => {
        const errors = await check(value);

        expect(errors).toEqual([]);
        expect(request).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(0);
    });

    it.each([429, 503])("fails open on HTTP %s and clears the timeout", async (status) => {
        request.mockResolvedValueOnce(new Response("unavailable", { status }));

        const errors = await check("password");

        expect(errors).toEqual([]);
        expect(warn).toHaveBeenCalledWith(`HIBP range lookup returned ${status} — failing open for this check.`);
        expect(jest.getTimerCount()).toBe(0);
    });

    it.each([
        { error: new Error("network unavailable"), message: "network unavailable" },
        { error: "unexpected rejection", message: "unknown error" },
    ])("fails open on transport rejection: $message", async ({ error, message }) => {
        request.mockRejectedValueOnce(error);

        const errors = await check("password");

        expect(errors).toEqual([]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining(`lookup failed (${message})`));
        expect(jest.getTimerCount()).toBe(0);
    });

    it("fails open if reading the response body fails", async () => {
        const response = new Response();
        jest.spyOn(response, "text").mockRejectedValueOnce(new Error("body interrupted"));
        request.mockResolvedValueOnce(response);

        const errors = await check("password");

        expect(errors).toEqual([]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("body interrupted"));
        expect(jest.getTimerCount()).toBe(0);
    });

    it("aborts at the configured timeout and completes validation without hanging", async () => {
        request.mockImplementation(
            (_url, options) =>
                new Promise((_resolve, reject) => {
                    options!.signal!.addEventListener("abort", () => reject(new Error("request aborted")), { once: true });
                }),
        );

        const pending = check("password");
        const signal = request.mock.calls[0][1]!.signal!;
        await jest.advanceTimersByTimeAsync(1999);
        expect(signal.aborted).toBe(false);
        await jest.advanceTimersByTimeAsync(1);
        const errors = await pending;

        expect(signal.aborted).toBe(true);
        expect(errors).toEqual([]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("request aborted"));
        expect(jest.getTimerCount()).toBe(0);
    });

    it("respects custom validation options", async () => {
        class CustomInput {
            @IsNotPwned({ message: "Choose another password", context: { fieldCode: "password" } })
            public password = "password";
        }
        request.mockResolvedValueOnce(new Response(`${suffix}:1`));

        const errors = await validate(new CustomInput());

        expect(errors[0].constraints).toEqual({ IsNotPwned: "Choose another password" });
        expect(errors[0].contexts).toEqual({ IsNotPwned: { fieldCode: "password" } });
    });
});
