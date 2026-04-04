import { HttpStatus } from "@nestjs/common";

import { HandlerErrorKind } from "../error-kinds";
import { BaseException } from "./base.exception";

export class HandlerException extends BaseException {
    private constructor(kind: Exception.HandlerErrorKind, statusCode: number, messageKey: string, params?: UnknownObject) {
        super(kind, statusCode, messageKey, params);
    }

    public static badRequest(messageKey = "handlers.bad_request", params?: UnknownObject): HandlerException {
        return new HandlerException(HandlerErrorKind.BadRequest, HttpStatus.BAD_REQUEST, messageKey, params);
    }

    public static forbidden(messageKey = "handlers.forbidden", params?: UnknownObject): HandlerException {
        return new HandlerException(HandlerErrorKind.Forbidden, HttpStatus.FORBIDDEN, messageKey, params);
    }

    public static notFound(messageKey = "handlers.not_found", params?: UnknownObject): HandlerException {
        return new HandlerException(HandlerErrorKind.NotFound, HttpStatus.NOT_FOUND, messageKey, params);
    }

    public static conflict(messageKey = "handlers.conflict", params?: UnknownObject): HandlerException {
        return new HandlerException(HandlerErrorKind.Conflict, HttpStatus.CONFLICT, messageKey, params);
    }

    public static internal(messageKey = "handlers.internal_error", params?: UnknownObject): HandlerException {
        return new HandlerException(HandlerErrorKind.Internal, HttpStatus.INTERNAL_SERVER_ERROR, messageKey, params);
    }

    public static unauthorized(messageKey = "handlers.unauthorized", params?: UnknownObject): HandlerException {
        return new HandlerException(HandlerErrorKind.Unauthorized, HttpStatus.UNAUTHORIZED, messageKey, params);
    }

    public static unprocessable(messageKey = "handlers.unprocessable", params?: UnknownObject): HandlerException {
        return new HandlerException(HandlerErrorKind.Unprocessable, HttpStatus.UNPROCESSABLE_ENTITY, messageKey, params);
    }
}
