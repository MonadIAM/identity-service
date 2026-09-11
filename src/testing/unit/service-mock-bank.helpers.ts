import { jest } from "@jest/globals";

import { RepositoryMockBank } from "./repository-mock-bank.helpers";

export class ServiceMockBank extends RepositoryMockBank implements Unit.Domain.ServiceMockBank.Contract {
    public services(): Unit.Domain.ServiceMocks.Contract {
        return {
            membershipHistoryService: this.membershipHistoryService(),
            secondFactorSecret: this.secondFactorSecret(),
            hashing: this.hashing(),
            crypto: this.crypto(),
            totp: this.totp(),
            jwt: this.jwt(),
        };
    }

    private membershipHistoryService(): Unit.Domain.ServiceMocks.MembershipHistoryService {
        return {
            create: jest.fn(() => Promise.resolve()),
            close: jest.fn(() => Promise.resolve()),
        };
    }

    private secondFactorSecret(): Unit.Domain.ServiceMocks.SecondFactorSecret {
        return {
            resolve: jest.fn(() => Promise.resolve({ secret: "unit-secret" })),
            encrypt: jest.fn(),
        };
    }

    private hashing(): Unit.Domain.ServiceMocks.Hashing {
        return {
            hash: jest.fn(() => Promise.resolve("unit-new-hash")),
            verify: jest.fn(() => Promise.resolve(true)),
            verifyAndUpgrade: jest.fn(),
        };
    }

    private crypto(): Unit.Domain.ServiceMocks.Crypto {
        return {
            hashToken: jest.fn(() => "token-hash"),
            generateRecoveryCodes: jest.fn(),
            generateRecoveryCode: jest.fn(),
            verifyCodeChallenge: jest.fn(),
            generateToken: jest.fn(),
            generateOTP: jest.fn(),
        };
    }

    private totp(): Unit.Domain.ServiceMocks.TOTP {
        return {
            verify: jest.fn(() => true),
            createSecret: jest.fn(),
            createURI: jest.fn(),
        };
    }

    private jwt(): Unit.Domain.ServiceMocks.JWT {
        return {
            computePairwiseSubject: jest.fn(() => Promise.resolve("pairwise-subject")),
            signRefreshToken: jest.fn(() => Promise.resolve("refresh-token")),
            signAccessToken: jest.fn(() => Promise.resolve("access-token")),
            signIdToken: jest.fn(() => Promise.resolve("id-token")),
            sign: jest.fn(),
        };
    }
}
