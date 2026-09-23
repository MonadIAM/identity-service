import { Allow, isEnum, isInt, isPositive, isString, isUUID, ValidateBy, ValidationOptions } from "class-validator";
import { Expose, Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { PasswordValidationMode } from "~common/enums";

import { StandardValidationDecorators } from "./default-validator.utility";

export abstract class Validator extends StandardValidationDecorators {
    private static compose(...decorators: PropertyDecorator[]): PropertyDecorator {
        return function applyComposedDecorator(target: object, propertyKey: string | symbol): void {
            for (const decorator of decorators) {
                decorator(target, propertyKey);
            }
        };
    }

    private static listOrSingle(
        name: string,
        validate: (value: unknown) => boolean,
        options: ValidationOptions,
    ): PropertyDecorator {
        return ValidateBy(
            { name, validator: { validate: (value) => (Array.isArray(value) ? value.every(validate) : validate(value)) } },
            options,
        );
    }

    public static IsPassword(label?: string): PropertyDecorator {
        const base = [this.IsString({}, label), this.Length(8, 64, {}, label), this.IsPrintableAscii({}, label)];

        switch (process.env.PASSWORD_VALIDATION_MODE) {
            case PasswordValidationMode.PWNED:
                return this.compose(...base, this.IsNotPwned({}, label));
            case PasswordValidationMode.SIMPLE:
                return this.compose(
                    ...base,
                    this.HasDigit({}, label),
                    this.HasUppercase({}, label),
                    this.HasSpecialCharacter({}, label),
                );
            case PasswordValidationMode.LOCAL:
            default:
                return this.compose(...base, this.IsNotBlocklisted({}, label));
        }
    }

    public static IsPositiveInt(label?: string): PropertyDecorator {
        return this.compose(this.IsInt({}, label), this.IsPositive({}, label));
    }

    public static IsListOrSingleString(label?: string): PropertyDecorator {
        return (target, key) =>
            this.listOrSingle("isString", isString, this.wrap("IS_STRING", { property: key }, {}, label))(target, key);
    }

    public static IsListOrSingleEnum(enumeration: object, label?: string): PropertyDecorator {
        return (target, key) =>
            this.listOrSingle(
                "isEnum",
                (value) => isEnum(value, enumeration),
                this.wrap("IS_ENUM", { property: key }, {}, label),
            )(target, key);
    }

    public static IsListOrSingleUUID(label?: string, version?: validator.UUIDVersion): PropertyDecorator {
        return (target, key) =>
            this.listOrSingle(
                "isUuid",
                (value) => isUUID(value, version ?? "all"),
                this.wrap("IS_UUID", { property: key, version }, {}, label),
            )(target, key);
    }

    public static IsListOrSinglePositiveInt(label?: string): PropertyDecorator {
        return (target, key) => {
            Transform(({ value }) => {
                const convert = (item: unknown): unknown => (typeof item === "string" ? Number(item) : item);
                return Array.isArray(value) ? value.map(convert) : convert(value);
            })(target, key);
            this.listOrSingle("isInt", isInt, this.wrap("IS_INT", { property: key }, {}, label))(target, key);
            this.listOrSingle(
                "isPositive",
                isPositive,
                this.wrap("IS_POSITIVE", { property: key }, {}, label),
            )(target, key);
        };
    }

    public static FromAlias(...keys: string[]): PropertyDecorator {
        const read = Transform(({ obj }) => keys.map((key) => obj[key]).find((value) => value !== undefined));

        return function applyFromAlias(target: object, propertyKey: string | symbol): void {
            read(target, propertyKey);
            keys.filter((key) => key !== propertyKey).forEach((key) => Allow()(target, key));
        };
    }

    public static ExposeAs(wireName: string): PropertyDecorator {
        return function applyExposeAs(target: object, propertyKey: string | symbol): void {
            Expose({ name: wireName })(target, propertyKey);
            Transform(({ obj }) => obj[propertyKey], { toClassOnly: true })(target, propertyKey);
            ApiProperty({ name: wireName })(target, propertyKey);
        };
    }
}
