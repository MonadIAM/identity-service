import { ApiPropertyOptional, ApiSchema } from "@nestjs/swagger";

import { SuccessMessageDTO } from "~common/dto";
import { Validator } from "~common/validator";

@ApiSchema({ name: "FederatedAuthnCallbackResult" })
export class FederatedCallbackResultDTO extends SuccessMessageDTO {
    @Validator.ExposeAs("authorizationUrl")
    @Validator.IsString()
    @ApiPropertyOptional({ type: String })
    declare public authorizationUrl: string;

    @Validator.ExposeAs("recovery_codes")
    @Validator.IsOptional()
    @Validator.IsArray()
    @Validator.IsString({ each: true })
    @ApiPropertyOptional({ type: [String] })
    declare public recoveryCodes?: string[];
}
