import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { SuccessMessageDTO } from "~common/dto";
import { Validator } from "~common/validator";

@ApiSchema({ name: "SessionRefreshResult" })
export class RefreshResultDTO extends SuccessMessageDTO {
    @Expose()
    @Validator.IsString()
    @ApiProperty({ required: true, type: String })
    declare public accessToken: string;
}
