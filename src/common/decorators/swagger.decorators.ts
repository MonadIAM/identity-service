import { ApiExtraModels, ApiResponse, getSchemaPath } from "@nestjs/swagger";
import { applyDecorators } from "@nestjs/common";

import { EXCEPTION_EXAMPLES, OAUTH_EXCEPTION_EXAMPLES } from "~common/exceptions";
import { OAuthErrorResponseBodyDTO, ErrorResponseBodyDTO } from "~common/dto";

export class Swagger {
    public static Exceptions(...statuses: (keyof typeof EXCEPTION_EXAMPLES)[]): MethodDecorator & ClassDecorator {
        return applyDecorators(
            ApiExtraModels(ErrorResponseBodyDTO),
            ...statuses.map((status) =>
                ApiResponse({
                    status,
                    schema: { $ref: getSchemaPath(ErrorResponseBodyDTO) },
                    example: EXCEPTION_EXAMPLES[status],
                }),
            ),
        );
    }

    public static OAuthExceptions(
        ...statuses: (keyof typeof OAUTH_EXCEPTION_EXAMPLES)[]
    ): MethodDecorator & ClassDecorator {
        return applyDecorators(
            ApiExtraModels(OAuthErrorResponseBodyDTO),
            ...statuses.map((status) =>
                ApiResponse({
                    status,
                    schema: { $ref: getSchemaPath(OAuthErrorResponseBodyDTO) },
                    example: OAUTH_EXCEPTION_EXAMPLES[status],
                }),
            ),
        );
    }
}
