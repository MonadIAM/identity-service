import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { IdentifierType } from "~context/enums";
import { Validator } from "~common/validator";

@ApiSchema({ name: "Identifier" })
export class IdentifierDTO {
    @Expose()
    @Validator.IsUUID()
    @ApiProperty({ required: true, type: String, format: "uuid" })
    declare public id: string;

    @Expose()
    @Validator.IsEnum(IdentifierType)
    @ApiProperty({ required: true, enum: IdentifierType, enumName: "IdentifierType" })
    declare public type: IdentifierType;

    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public value: string;

    @Expose()
    @ApiProperty({ required: false, type: String })
    declare public provider?: string;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    declare public isVerified: boolean;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    declare public receiveNotifications: boolean;

    @Expose()
    @Validator.IsBoolean()
    @ApiProperty({ required: true, type: Boolean })
    declare public isPublicContact: boolean;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: false, type: Date })
    declare public verifiedAt?: Date;

    @Expose()
    @Validator.IsDate()
    @ApiProperty({ required: true, type: Date })
    declare public createdAt: Date;
}
