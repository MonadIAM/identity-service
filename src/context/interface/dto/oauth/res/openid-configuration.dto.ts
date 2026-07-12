import { ApiProperty, ApiSchema } from "@nestjs/swagger";

import { Validator } from "~common/validator";

import { AuthzServerMetadataDTO } from "./authz-server-metadata.dto";

@ApiSchema({ name: "OpenIdConfiguration" })
export class OpenIdConfigurationDTO extends AuthzServerMetadataDTO {
    @Validator.ExposeAs("userinfo_endpoint")
    @Validator.IsString()
    @ApiProperty({ type: String })
    declare public userinfoEndpoint: string;

    @Validator.ExposeAs("end_session_endpoint")
    @Validator.IsString()
    @ApiProperty({ type: String })
    declare public endSessionEndpoint: string;

    @Validator.ExposeAs("subject_types_supported")
    @Validator.IsArray()
    @ApiProperty({ type: [String], enum: ["pairwise"] })
    declare public subjectTypesSupported: ["pairwise"];

    @Validator.ExposeAs("id_token_signing_alg_values_supported")
    @Validator.IsArray()
    @ApiProperty({ type: [String], enum: ["ES256"] })
    declare public idTokenSigningAlgValuesSupported: ["ES256"];

    @Validator.ExposeAs("claims_supported")
    @Validator.IsArray()
    @ApiProperty({ type: [String] })
    declare public claimsSupported: string[];
}
