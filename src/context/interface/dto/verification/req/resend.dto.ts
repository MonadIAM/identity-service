import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { VerificationScenario } from "~context/enums";
import { Validator } from "~common/validator";

export class ResendVerificationBodyDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    public identifier!: string;

    @Expose()
    @Validator.IsEnum(VerificationScenario)
    @ApiProperty({ required: true, enum: VerificationScenario, enumName: "VerificationScenario" })
    public scenario!: VerificationScenario;
}
