import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
    ValidatorConstraintInterface,
    ValidatorConstraint,
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
} from "class-validator";

const BLOCKLIST: ReadonlySet<string> = new Set(
    readFileSync(join(__dirname, "../data/common-passwords.txt"), "utf-8")
        .split("\n")
        .map((line) => line.trim().toLowerCase())
        .filter(Boolean),
);

@ValidatorConstraint({ name: "IsNotBlocklisted", async: false })
class IsNotBlocklistedConstraint implements ValidatorConstraintInterface {
    public validate(value: unknown): boolean {
        return typeof value === "string" && !BLOCKLIST.has(value.toLowerCase());
    }

    public defaultMessage(args: ValidationArguments): string {
        return `Field "${String(args.property)}" is too common/compromised to be used as a password.`;
    }
}

export function IsNotBlocklisted(options?: ValidationOptions): PropertyDecorator {
    return (target, propertyName) => {
        registerDecorator({
            name: "IsNotBlocklisted",
            target: target.constructor,
            propertyName: propertyName.toString(),
            validator: IsNotBlocklistedConstraint,
            options,
        });
    };
}
