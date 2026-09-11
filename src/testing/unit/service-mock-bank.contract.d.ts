declare namespace Unit {
    namespace Domain {
        namespace ServiceMockBank {
            interface Contract extends RepositoryMockBank.Contract {
                readonly services: Services.Signature;
            }

            namespace Services {
                type Result = ServiceMocks.Contract;

                type Signature = () => Result;
            }
        }

        namespace ServiceMocks {
            type Hashing = {
                verifyAndUpgrade: Mock;
                verify: Mock;
                hash: Mock;
            };

            type TOTP = {
                createSecret: Mock;
                createURI: Mock;
                verify: Mock;
            };

            type Crypto = {
                generateRecoveryCodes: Mock;
                generateRecoveryCode: Mock;
                verifyCodeChallenge: Mock;
                generateToken: Mock;
                generateOTP: Mock;
                hashToken: Mock;
            };

            type JWT = {
                computePairwiseSubject: Mock;
                signRefreshToken: Mock;
                signAccessToken: Mock;
                signIdToken: Mock;
                sign: Mock;
            };

            type SecondFactorSecret = {
                resolve: Mock;
                encrypt: Mock;
            };

            type MembershipHistoryService = {
                create: Mock;
                close: Mock;
            };

            interface Contract {
                readonly membershipHistoryService: MembershipHistoryService;
                readonly secondFactorSecret: SecondFactorSecret;
                readonly hashing: Hashing;
                readonly crypto: Crypto;
                readonly totp: TOTP;
                readonly jwt: JWT;
            }
        }
    }
}
