import { INestApplication, ValidationError, ValidationPipe, ValidationPipeOptions } from "@nestjs/common";

import { Exception, ErrorCode } from "~common/exceptions";

export abstract class BootstrapPipes {
    public static readonly oauthValidationPipe = BootstrapPipes.createValidationPipe({
        exceptionFactory: BootstrapPipes.validationExceptionFactory,
        transformOptions: { excludeExtraneousValues: true },
    });

    public static readonly oauthTokenValidationPipe = BootstrapPipes.createValidationPipe({
        exceptionFactory: BootstrapPipes.oauthTokenValidationExceptionFactory,
        transformOptions: { excludeExtraneousValues: true },
    });

    public static readonly applyGlobalPipes = (application: INestApplication): void => {
        application.useGlobalPipes(
            BootstrapPipes.createValidationPipe({
                exceptionFactory: BootstrapPipes.validationExceptionFactory,
            }),
        );
    };

    private static validationExceptionFactory(validationErrors: ValidationError[]): Exception {
        const details = BootstrapPipes.formatValidationErrors(validationErrors);
        return Exception.validationFailed(details);
    }

    private static oauthTokenValidationExceptionFactory(validationErrors: ValidationError[]): Exception {
        const details = BootstrapPipes.formatValidationErrors(validationErrors);
        return Exception.badRequest({
            messageKey: "commands.oauth.INVALID_REQUEST",
            code: ErrorCode.INVALID_REQUEST,
            details,
        });
    }

    private static createValidationPipe(
        options: Pick<ValidationPipeOptions, "exceptionFactory" | "transformOptions">,
    ): ValidationPipe {
        return new ValidationPipe({
            ...options,
            forbidNonWhitelisted: true,
            whitelist: true,
            transform: true,
        });
    }

    private static formatValidationErrors(errors: ValidationError[]): Exception.ValidationDetail[] {
        const results: Exception.ValidationDetail[] = [];

        const collect = (error: ValidationError, parentPath: string = ""): void => {
            const currentPath = parentPath ? `${parentPath}.${error.property}` : error.property;

            if (error.constraints) {
                for (const [constraintKey, messageOrKey] of Object.entries(error.constraints)) {
                    results.push({
                        path: currentPath,
                        constraint: constraintKey,
                        value: error.value,
                        message: messageOrKey,
                        args: error.contexts ? error.contexts[constraintKey] : {},
                    });
                }
            }

            if (error.children?.length) {
                for (const child of error.children) {
                    collect(child, currentPath);
                }
            }
        };

        for (const error of errors) {
            collect(error);
        }

        return results;
    }
}
