import { Expose, Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { Allow, ValidateIf } from "class-validator";

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
        return this.compose(
            ValidateIf((_, value) => !Array.isArray(value)),
            this.IsString({}, label),

            ValidateIf((_, value) => Array.isArray(value)),
            this.IsArray({}, label),
            this.IsString({ each: true }, label),
        );
    }

    public static IsListOrSingleEnum(enumeration: object, label?: string): PropertyDecorator {
        return this.compose(
            ValidateIf((_, value) => Array.isArray(value)),
            this.IsArray({}, label),
            this.IsEnum(enumeration, { each: true }, label),

            ValidateIf((_, value) => !Array.isArray(value)),
            this.IsEnum(enumeration, {}, label),
        );
    }

    public static IsListOrSingleUUID(label?: string, version?: validator.UUIDVersion): PropertyDecorator {
        return this.compose(
            ValidateIf((_, value) => Array.isArray(value)),
            this.IsArray({}, label),
            this.IsUUID(version, { each: true }, label),

            ValidateIf((_, value) => !Array.isArray(value)),
            this.IsUUID(version, {}, label),
        );
    }

    public static IsListOrSinglePositiveInt(label?: string): PropertyDecorator {
        return this.compose(
            Transform(({ value }) => {
                if (Array.isArray(value)) {
                    return value.map((v) => Number(v));
                } else {
                    return typeof value === "string" ? Number(value) : value;
                }
            }),

            ValidateIf((_, value) => Array.isArray(value)),
            this.IsArray({}, label),
            this.IsInt({ each: true }, label),
            this.IsPositive({ each: true }, label),

            ValidateIf((_, value) => !Array.isArray(value)),
            this.IsInt({}, label),
            this.IsPositive({}, label),
        );
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
