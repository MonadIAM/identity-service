import { Inject, Injectable, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { VAULT_TRANSIT_SERVICE } from "~common/services";

@Injectable({ scope: Scope.DEFAULT })
export class SecondFactorSecretService implements InfrastructureServices.SecondFactorSecret.Contract {
    private readonly key: string;

    public constructor(
        @Inject(VAULT_TRANSIT_SERVICE)
        private readonly vaultTransitService: CommonServices.VaultTransit.Contract,
        configService: ConfigService,
    ) {
        this.key = configService.getOrThrow<string>("VAULT_TRANSIT_TOTP_KEY");
    }

    public async encrypt(
        props: InfrastructureServices.SecondFactorSecret.Encrypt.Props,
    ): InfrastructureServices.SecondFactorSecret.Encrypt.Result {
        const { ciphertext } = await this.vaultTransitService.encrypt({ plaintext: props.secret, name: this.key });
        return ciphertext;
    }

    public async resolve(
        props: InfrastructureServices.SecondFactorSecret.Resolve.Props,
    ): InfrastructureServices.SecondFactorSecret.Resolve.Result {
        const { secret } = props;
        const match = /^vault:v(\d+):/.exec(secret);

        if (!secret.startsWith("vault:")) {
            return {
                ciphertext: await this.encrypt({ secret }),
                plaintext: secret,
            };
        }

        const plaintext = await this.vaultTransitService.decrypt({ ciphertext: secret, name: this.key });
        const latestVersion = await this.vaultTransitService.getLatestVersion({ name: this.key });

        if (match && Number(match[1]) < latestVersion) {
            const { ciphertext } = await this.vaultTransitService.rewrap({ ciphertext: secret, name: this.key });
            return { ciphertext, plaintext };
        }

        return { plaintext };
    }
}
