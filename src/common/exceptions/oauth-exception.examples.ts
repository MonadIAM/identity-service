import { HttpStatus } from "@nestjs/common";

import { ErrorCode } from "./enums";

export const OAUTH_EXCEPTION_EXAMPLES = {
    [HttpStatus.BAD_REQUEST]: {
        timestamp: "2026-02-22T19:19:13.109Z",
        path: "/api/oauth/token",
        statusCode: 400,
        error: ErrorCode.INVALID_REQUEST,
        errorDescription: "The request is missing a required parameter or is otherwise malformed.",
    },

    [HttpStatus.UNAUTHORIZED]: {
        timestamp: "2026-02-22T19:20:44.518Z",
        path: "/api/oauth/token",
        statusCode: 401,
        error: ErrorCode.INVALID_GRANT,
        errorDescription: "The refresh token is invalid, expired, or revoked.",
    },

    [HttpStatus.FORBIDDEN]: {
        timestamp: "2026-02-22T19:21:07.843Z",
        path: "/api/oauth/token",
        statusCode: 403,
        error: ErrorCode.CORS_ORIGIN_FORBIDDEN,
        errorDescription: "The request origin is not allowed.",
    },

    [HttpStatus.REQUEST_TIMEOUT]: {
        timestamp: "2026-02-22T19:22:49.384Z",
        path: "/api/oauth/token",
        statusCode: 408,
        error: ErrorCode.TIMEOUT,
        errorDescription: "Database lock wait timeout exceeded.",
    },

    [HttpStatus.CONFLICT]: {
        timestamp: "2026-02-22T19:22:15.692Z",
        path: "/api/oauth/token",
        statusCode: 409,
        error: ErrorCode.CONFLICT,
        errorDescription: "The request could not be completed due to a conflict with the current state.",
    },

    [HttpStatus.UNPROCESSABLE_ENTITY]: {
        timestamp: "2026-02-22T19:19:13.109Z",
        path: "/api/oauth/token",
        statusCode: 422,
        error: ErrorCode.UNPROCESSABLE,
        errorDescription: "Validation failed.",
        details: [
            {
                path: "code",
                constraint: "isString",
                invalidValue: 123,
                message: 'Field "code" must be a string',
            },
        ],
    },

    [HttpStatus.INTERNAL_SERVER_ERROR]: {
        timestamp: "2026-02-22T19:19:13.109Z",
        path: "/api/oauth/token",
        statusCode: 500,
        error: ErrorCode.INTERNAL,
        errorDescription: "Internal Server Error",
    },

    [HttpStatus.SERVICE_UNAVAILABLE]: {
        timestamp: "2026-02-22T19:24:31.762Z",
        path: "/api/oauth/token",
        statusCode: 503,
        error: ErrorCode.CONNECTION_ERROR,
        errorDescription: "The connection to the database was lost.",
    },
} as const;
