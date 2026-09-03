import { Injectable, Scope } from "@nestjs/common";
import { Secret, TOTP } from "otpauth";

@Injectable({ scope: Scope.DEFAULT })
export class TOTPService implements CommonServices.TOTP.Contract {
    private readonly issuer = "MonadIAM";
    private readonly algorithm = "SHA1";
    private readonly secretSize = 20;
    private readonly period = 30;
    private readonly window = 1;
    private readonly digits = 6;

    public createSecret(): CommonServices.TOTP.CreateSecret.Result {
        return new Secret({ size: this.secretSize }).base32;
    }

    public createURI(props: CommonServices.TOTP.CreateURI.Props): CommonServices.TOTP.CreateURI.Result {
        return this.generate({ secret: props.secret, label: props.label }).toString();
    }

    public verify(props: CommonServices.TOTP.VerifyTOTP.Props): CommonServices.TOTP.VerifyTOTP.Result {
        return this.generate({ secret: props.secret }).validate({ token: props.code, window: this.window }) !== null;
    }

    public generate(props: CommonServices.TOTP.Generate.Props): CommonServices.TOTP.Generate.Result {
        return new TOTP({
            secret: Secret.fromBase32(props.secret),
            algorithm: this.algorithm,
            issuer: this.issuer,
            period: this.period,
            digits: this.digits,
            label: props.label,
        });
    }
}
