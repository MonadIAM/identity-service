declare namespace Unit.Domain {
    namespace ServiceMockBank {
        interface Contract extends RepositoryMockBank.Contract {
            services: Services.Signature;
        }

        namespace Services {
            type Result = ServiceMocks.Contract;

            type Signature = () => Result;
        }
    }

    namespace ServiceMocks {
        type Hashing = {
            verify: Jest.Mock<CommonServices.Hashing.Verify.Signature>;
            verifyAndUpgrade: Jest.Mock;
            hash: Jest.Mock;
        };

        type TOTP = {
            createSecret: Jest.Mock;
            createURI: Jest.Mock;
            verify: Jest.Mock;
        };

        type Crypto = {
            generateRecoveryCodes: Jest.Mock;
            generateRecoveryCode: Jest.Mock;
            verifyCodeChallenge: Jest.Mock;
            generateToken: Jest.Mock;
            generateOTP: Jest.Mock;
            hashToken: Jest.Mock;
        };

        type JWT = {
            signIdToken: Jest.Mock<CommonServices.JWT.SignIdToken.Signature>;
            computePairwiseSubject: Jest.Mock;
            signRefreshToken: Jest.Mock;
            signAccessToken: Jest.Mock;
            sign: Jest.Mock;
        };

        type SecondFactorSecret = {
            resolve: Jest.Mock;
            encrypt: Jest.Mock;
        };

        interface Contract {
            secondFactorSecret: SecondFactorSecret;
            hashing: Hashing;
            crypto: Crypto;
            totp: TOTP;
            jwt: JWT;
        }
    }
}
