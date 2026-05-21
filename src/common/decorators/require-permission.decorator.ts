import { SetMetadata } from "@nestjs/common";

import { PermissionCode } from "~context/enums";

import { REQUIRE_PERMISSION } from "./tokens";

export function RequirePermission(permission: PermissionCode): MethodDecorator & ClassDecorator {
    return SetMetadata(REQUIRE_PERMISSION, permission);
}
