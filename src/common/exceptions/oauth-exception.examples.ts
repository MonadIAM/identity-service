import { HttpStatus } from "@nestjs/common";

import { ErrorCode } from "./enums";

export const OAUTH_EXCEPTION_EXAMPLES = {
    [HttpStatus.BAD_REQUEST]: {
        timestamp: "2026-02-22T19:19:13.109Z",
        path: "/api/oauth/token",
        status_code: 400,
        error: ErrorCode.INVALID_REQUEST,
        error_description: "The request is missing a required parameter or is otherwise malformed.",
    },

    [HttpStatus.UNAUTHORIZED]: {
        timestamp: "2026-02-22T19:20:44.518Z",
        path: "/api/oauth/token",
        status_code: 401,
        error: ErrorCode.INVALID_GRANT,
        error_description: "The refresh token is invalid, expired, or revoked.",
    },

    [HttpStatus.FORBIDDEN]: {
        timestamp: "2026-02-22T19:21:07.843Z",
        path: "/api/oauth/token",
        status_code: 403,
        error: ErrorCode.CORS_ORIGIN_FORBIDDEN,
        error_description: "The request origin is not allowed.",
    },

    [HttpStatus.REQUEST_TIMEOUT]: {
        timestamp: "2026-02-22T19:22:49.384Z",
        path: "/api/oauth/token",
        status_code: 408,
        error: ErrorCode.TIMEOUT,
        error_description: "Database lock wait timeout exceeded.",
    },

    [HttpStatus.CONFLICT]: {
        timestamp: "2026-02-22T19:22:15.692Z",
        path: "/api/oauth/token",
        status_code: 409,
        error: ErrorCode.CONFLICT,
        error_description: "The request could not be completed due to a conflict with the current state.",
    },

    [HttpStatus.UNPROCESSABLE_ENTITY]: {
        timestamp: "2026-02-22T19:19:13.109Z",
        path: "/api/oauth/token",
        status_code: 422,
        error: ErrorCode.UNPROCESSABLE,
        error_description: "Validation failed.",
        details: [
            {
                message: 'Field "code" must be a string',
                constraint: "isString",
                path: "code",
                value: 123,
            },
        ],
    },

    [HttpStatus.INTERNAL_SERVER_ERROR]: {
        timestamp: "2026-02-22T19:19:13.109Z",
        path: "/api/oauth/token",
        status_code: 500,
        error: ErrorCode.INTERNAL,
        error_description: "Internal Server Error",
    },

    [HttpStatus.SERVICE_UNAVAILABLE]: {
        timestamp: "2026-02-22T19:24:31.762Z",
        path: "/api/oauth/token",
        status_code: 503,
        error: ErrorCode.CONNECTION_ERROR,
        error_description: "The connection to the database was lost.",
    },
} as const;
