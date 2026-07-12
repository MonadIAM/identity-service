import { createHash } from "node:crypto";
import { Logger } from "@nestjs/common";
import ms from "ms";
import {
    ValidatorConstraintInterface,
    ValidatorConstraint,
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
} from "class-validator";

const REQUEST_TIMEOUT_MS = ms(process.env.HIBP_REQUEST_TIMEOUT);
const { HIBP_RANGE_URL } = process.env;

@ValidatorConstraint({ name: "IsNotPwned", async: true })
class IsNotPwnedConstraint implements ValidatorConstraintInterface {
    private readonly logger = new Logger("IsNotPwned");

    public async validate(value: unknown): Promise<boolean> {
        if (typeof value !== "string") {
            return true;
        }

        const hash = createHash("sha1").update(value, "utf-8").digest("hex").toUpperCase();
        const prefix = hash.slice(0, 5);
        const suffix = hash.slice(5);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
            const response = await fetch(`${HIBP_RANGE_URL}${prefix}`, {
                headers: { "Add-Padding": "true" },
                signal: controller.signal,
            });

            if (response.ok) {
                const body = await response.text();
                return !body.split("\r\n").some((line) => line.split(":")[0] === suffix);
            } else {
                this.logger.warn(`HIBP range lookup returned ${response.status} — failing open for this check.`);
                return true;
            }
        } catch (error) {
            this.logger.warn(
                `HIBP range lookup failed (${error instanceof Error ? error.message : "unknown error"}) — failing open for this check. ` +
                    "If this happens consistently, check outbound network/egress rules for api.pwnedpasswords.com.",
            );
            return true;
        } finally {
            clearTimeout(timeout);
        }
    }

    public defaultMessage(args: ValidationArguments): string {
        return `Field "${String(args.property)}" has appeared in a known password breach (Have I Been Pwned).`;
    }
}

export function IsNotPwned(options?: ValidationOptions): PropertyDecorator {
    return (target, propertyName) => {
        registerDecorator({
            name: "IsNotPwned",
            target: target.constructor,
            propertyName: propertyName.toString(),
            validator: IsNotPwnedConstraint,
            options,
        });
    };
}
