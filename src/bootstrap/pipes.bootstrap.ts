import { INestApplication, ValidationError, ValidationPipe } from "@nestjs/common";

import { Exception } from "~common/exceptions";

export abstract class BootstrapPipes {
    public static readonly exceptionFactory = (validationErrors: ValidationError[]): Exception => {
        const details = this.formatValidationErrors(validationErrors);
        return Exception.validationFailed(details);
    };

    public static readonly oauthValidationPipe = new ValidationPipe({
        exceptionFactory: BootstrapPipes.exceptionFactory,
        transformOptions: { excludeExtraneousValues: true },
        forbidNonWhitelisted: true,
        whitelist: true,
        transform: true,
    });

    public static applyGlobalPipes(application: INestApplication): void {
        application.useGlobalPipes(
            new ValidationPipe({
                exceptionFactory: BootstrapPipes.exceptionFactory,
                forbidNonWhitelisted: true,
                whitelist: true,
                transform: true,
            }),
        );
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
