import { SetMetadata } from "@nestjs/common";

export const ELEVATED_ACCESS_KEY = Symbol("elevated-access");

export function ElevatedAccess(): MethodDecorator {
    return SetMetadata(ELEVATED_ACCESS_KEY, true);
}
