import { Outbox } from "~common/transaction-manager/entities";
import { KafkaTopic } from "~context/enums";

export class IntegrationLogMaskingMock implements Integration.ServiceMocks.LogMasking {
    public sign(props: TransactionManager.LogMasking.Sign.Props): TransactionManager.LogMasking.Sign.Result {
        return Promise.resolve({
            signature: `signed:${props.entity.constructor.name}:${props.entity.id}`,
            keyVersion: 7,
        });
    }

    public maskAuditLog(
        props: TransactionManager.LogMasking.MaskAuditLog.Props,
    ): TransactionManager.LogMasking.MaskAuditLog.Result {
        return Promise.resolve(props.input);
    }

    public maskChangeLog(
        props: TransactionManager.LogMasking.MaskChangeLog.Props,
    ): TransactionManager.LogMasking.MaskChangeLog.Result {
        return Promise.resolve(props.delta);
    }

    public normalize(value: TransactionManager.LogMasking.Normalize.Props): TransactionManager.LogMasking.Normalize.Result {
        return value;
    }

    public unflatten(
        _props: TransactionManager.LogMasking.Unflatten.Props,
    ): TransactionManager.LogMasking.Unflatten.Result {
        return undefined;
    }

    public flatten(_props: TransactionManager.LogMasking.Flatten.Props): TransactionManager.LogMasking.Flatten.Result {
        return undefined;
    }

    public mask(value: TransactionManager.LogMasking.Mask.Props): TransactionManager.LogMasking.Mask.Result {
        return value;
    }
}

export class IntegrationOutboxMock implements Integration.ServiceMocks.Outbox {
    public build(props: TransactionManager.Outbox.Build.Props): TransactionManager.Outbox.Build.Result {
        return new Outbox(props);
    }

    public buildAuditLogArchive(
        audit: TransactionManager.Outbox.BuildAuditLogArchive.Props,
    ): TransactionManager.Outbox.BuildAuditLogArchive.Result {
        return new Outbox({
            destinationTopic: KafkaTopic.AUDIT_LOG_ARCHIVE,
            payload: { id: audit.id },
            actionType: "ARCHIVE",
        });
    }

    public buildChangeLogArchive(
        change: TransactionManager.Outbox.BuildChangeLogArchive.Props,
    ): TransactionManager.Outbox.BuildChangeLogArchive.Result {
        return new Outbox({
            payload: { id: change.id, auditEntry: change.auditEntry },
            destinationTopic: KafkaTopic.CHANGE_LOG_ARCHIVE,
            actionType: "ARCHIVE",
        });
    }
}

export class IntegrationHashingMock implements Integration.ServiceMocks.Hashing {
    public readonly hashedValues: string[] = [];

    public verify(props: CommonServices.Hashing.Verify.Props): CommonServices.Hashing.Verify.Result {
        return Promise.resolve(props.storedHash === `hash:${props.value}`);
    }

    public verifyAndUpgrade(
        props: CommonServices.Hashing.VerifyAndUpgrade.Props,
    ): CommonServices.Hashing.VerifyAndUpgrade.Result {
        const isValid = props.storedHash === `hash:${props.value}`;
        return Promise.resolve({ isValid });
    }

    public hash(props: CommonServices.Hashing.Hash.Props): CommonServices.Hashing.Hash.Result {
        this.hashedValues.push(props.value);
        return Promise.resolve(`hash:${props.value}`);
    }
}

export class IntegrationCryptoMock implements Integration.ServiceMocks.Crypto {
    public generateRecoveryCodes(
        props: CommonServices.Crypto.GenerateRecoveryCodes.Props = {},
    ): CommonServices.Crypto.GenerateRecoveryCodes.Result {
        const count = props.count ?? 10;
        const codes: string[] = [];

        for (let index = 0; index < count; ++index) {
            codes.push(`recovery-code-${index + 1}`);
        }

        return codes;
    }

    public verifyCodeChallenge(
        props: CommonServices.Crypto.VerifyCodeChallenge.Props,
    ): CommonServices.Crypto.VerifyCodeChallenge.Result {
        return props.challenge === props.verifier;
    }

    public generateRecoveryCode(): CommonServices.Crypto.GenerateRecoveryCode.Result {
        return "recovery-code";
    }

    public hashToken(props: CommonServices.Crypto.HashToken.Props): CommonServices.Crypto.HashToken.Result {
        return `hash:${props.token}`;
    }

    public generateToken(): CommonServices.Crypto.GenerateToken.Result {
        return "generated-token";
    }

    public generateOTP(): CommonServices.Crypto.GenerateOTP.Result {
        return "123456";
    }
}

export class IntegrationSecondFactorSecretMock implements Integration.ServiceMocks.SecondFactorSecret {
    private resolvedCiphertext: Optional<string>;

    public setResolvedCiphertext(ciphertext?: string): void {
        this.resolvedCiphertext = ciphertext;
    }

    public resolve(
        props: InfrastructureServices.SecondFactorSecret.Resolve.Props,
    ): InfrastructureServices.SecondFactorSecret.Resolve.Result {
        return Promise.resolve({
            ciphertext: this.resolvedCiphertext,
            plaintext: props.secret,
        });
    }

    public encrypt(
        props: InfrastructureServices.SecondFactorSecret.Encrypt.Props,
    ): InfrastructureServices.SecondFactorSecret.Encrypt.Result {
        return Promise.resolve(`encrypted:${props.secret}`);
    }
}

export class IntegrationTOTPMock implements Integration.ServiceMocks.TOTP {
    private verification: CommonServices.TOTP.VerifyTOTP.Result = { step: 1 };

    public setStep(step: number): void {
        this.verification = { step };
    }

    public reject(): void {
        this.verification = null;
    }

    public createSecret(): CommonServices.TOTP.CreateSecret.Result {
        return "totp-secret";
    }

    public createURI(_props: CommonServices.TOTP.CreateURI.Props): CommonServices.TOTP.CreateURI.Result {
        return "otpauth://totp/integration";
    }

    public generate(_props: CommonServices.TOTP.Generate.Props): CommonServices.TOTP.Generate.Result {
        throw new Error("Not implemented for integration mock");
    }

    public verify(_props: CommonServices.TOTP.VerifyTOTP.Props): CommonServices.TOTP.VerifyTOTP.Result {
        return this.verification;
    }
}

export class IntegrationJWTMock implements Integration.ServiceMocks.JWT {
    public readonly refreshPayloads: CommonServices.JWT.SignRefreshToken.Props[] = [];
    public readonly accessPayloads: CommonServices.JWT.SignAccessToken.Props[] = [];
    public readonly idPayloads: CommonServices.JWT.SignIdToken.Props[] = [];
    private failure: Optional<Integration.ServiceMocks.JWT.Failure>;

    public setFailure(failure?: Integration.ServiceMocks.JWT.Failure): void {
        this.failure = failure;
    }

    public signRefreshToken(props: CommonServices.JWT.SignRefreshToken.Props): CommonServices.JWT.SignRefreshToken.Result {
        this.refreshPayloads.push(props);

        if (this.failure === "refresh") {
            return Promise.reject(new Error("refresh token signing failed"));
        } else {
            return Promise.resolve(`refresh:${String(props.payload.sid)}:${this.refreshPayloads.length}`);
        }
    }

    public signAccessToken(props: CommonServices.JWT.SignAccessToken.Props): CommonServices.JWT.SignAccessToken.Result {
        this.accessPayloads.push(props);
        if (this.failure === "access") {
            return Promise.reject(new Error("access token signing failed"));
        } else {
            return Promise.resolve(`access:${String(props.payload.sid)}:${this.accessPayloads.length}`);
        }
    }

    public signIdToken(props: CommonServices.JWT.SignIdToken.Props): CommonServices.JWT.SignIdToken.Result {
        this.idPayloads.push(props);
        if (this.failure === "id") {
            return Promise.reject(new Error("id token signing failed"));
        } else {
            return Promise.resolve(
                `id:${String(props.payload.sid)}:${String(props.payload.sub)}:${this.idPayloads.length}`,
            );
        }
    }

    public computePairwiseSubject(
        props: CommonServices.JWT.ComputePairwiseSubject.Props,
    ): CommonServices.JWT.ComputePairwiseSubject.Result {
        return Promise.resolve(`pairwise:${props.client}:${props.account}`);
    }

    public getPublicJWKS(): CommonServices.JWT.GetPublicJWKS.Result {
        return Promise.resolve({ keys: [] });
    }

    public verifyRefresh(_props: CommonServices.JWT.VerifyToken.Props): CommonServices.JWT.VerifyToken.Result {
        return Promise.reject(new Error("Not implemented for integration mock"));
    }

    public verifyIdToken(_props: CommonServices.JWT.VerifyToken.Props): CommonServices.JWT.VerifyToken.Result {
        return Promise.reject(new Error("Not implemented for integration mock"));
    }

    public verifyAccess(_props: CommonServices.JWT.VerifyToken.Props): CommonServices.JWT.VerifyToken.Result {
        return Promise.reject(new Error("Not implemented for integration mock"));
    }

    public resolveVerificationFailure(
        _props: CommonServices.JWT.ResolveVerificationFailure.Props,
    ): CommonServices.JWT.ResolveVerificationFailure.Result {
        return {
            description: "Not implemented for integration mock",
            messageKey: "services.session.SESSION_NOT_FOUND",
        };
    }

    public selectVerifiableVersions(
        _props: CommonServices.JWT.SelectVerifiableVersions.Props,
    ): CommonServices.JWT.SelectVerifiableVersions.Result {
        return [];
    }

    public getVerificationJWKS(
        _props: CommonServices.JWT.GetVerificationJWKS.Props,
    ): CommonServices.JWT.GetVerificationJWKS.Result {
        return Promise.resolve({ keys: [] });
    }

    public describeKeyVersion(
        _props: CommonServices.JWT.DescribeKeyVersion.Props,
    ): CommonServices.JWT.DescribeKeyVersion.Result {
        return Promise.reject(new Error("Not implemented for integration mock"));
    }

    public pruneJWKCache(_props: CommonServices.JWT.PruneJWKCache.Props): CommonServices.JWT.PruneJWKCache.Result {
        return undefined;
    }

    public sign(_props: CommonServices.JWT.Sign.Props): CommonServices.JWT.Sign.Result {
        return Promise.reject(new Error("Not implemented for integration mock"));
    }
}

export class IntegrationServiceMockBank implements Integration.ServiceMockBank.Contract {
    public logMasking(): Integration.ServiceMocks.LogMasking {
        return new IntegrationLogMaskingMock();
    }

    public outbox(): Integration.ServiceMocks.Outbox {
        return new IntegrationOutboxMock();
    }

    public hashing(): Integration.ServiceMocks.Hashing {
        return new IntegrationHashingMock();
    }

    public crypto(): Integration.ServiceMocks.Crypto {
        return new IntegrationCryptoMock();
    }

    public secondFactorSecret(): Integration.ServiceMocks.SecondFactorSecret {
        return new IntegrationSecondFactorSecretMock();
    }

    public totp(): Integration.ServiceMocks.TOTP {
        return new IntegrationTOTPMock();
    }

    public jwt(): Integration.ServiceMocks.JWT {
        return new IntegrationJWTMock();
    }
}
