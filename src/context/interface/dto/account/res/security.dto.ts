import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

@ApiSchema({ name: "AccountSecurity" })
export class SecurityDTO {
    @Expose()
    @ApiProperty({ required: true, type: Boolean })
    declare public hasPassword: boolean;

    @Expose()
    @ApiProperty({ required: true, type: Boolean })
    declare public hasSecondFactor: boolean;

    @Expose()
    @ApiProperty({ required: true, type: Boolean })
    declare public canConfirmByEmail: boolean;
}
