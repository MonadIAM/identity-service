declare namespace Commands.FederatedAuthn {
    type Identity = {
        provider: string;
        providerUserId: string;
        email?: string;
        emailVerified: boolean;
        profile: {
            displayName: string;
            pictureUrl?: string;
            timeZone?: string;
            locale?: string;
        };
    };

    type AuthnResult = MessageResult & {
        account: string;
        recoveryCodes?: string[];
    };

    interface Contract extends InternalContract, ControllerContract {}

    interface InternalContract {
        authenticateExisting: AuthenticateExisting.Signature;
        attachToExisting: AttachToExisting.Signature;
        resolveProvider: ResolveProvider.Signature;
        provision: Provision.Signature;
    }

    namespace AuthenticateExisting {
        type Props = {
            context: Extract.Meta;
            input: {
                account: Entities.Account;
            };
        };

        type Result = AuthnResult;

        type Signature = (props: Props) => Result;
    }

    namespace AttachToExisting {
        type Props = {
            context: Extract.Meta;
            input: Identity & {
                account: Entities.Account;
            };
        };

        type Result = Promise<AuthnResult>;

        type Signature = (props: Props) => Result;
    }

    namespace ResolveProvider {
        type Props = {
            provider: string;
        };

        type Result = globalThis.FederatedAuthn.ResolveProvider;

        type Signature = (props: Props) => Result;
    }

    namespace Provision {
        type Props = {
            context: Extract.Meta;
            input: Identity;
        };

        type Result = Promise<AuthnResult>;

        type Signature = (props: Props) => Result;
    }

    interface ControllerContract {
        authorize: Authorize.Signature;
        callback: Callback.Signature;
        redirect: Redirect.Signature;
    }

    namespace Redirect {
        type Props = { input: { provider: string; state: string; code?: string; iss?: string; error?: string } };
        type Result = Promise<{ url: string }>;
        type Signature = (props: Props) => Result;
    }

    namespace Authorize {
        type Props = {
            input: {
                authorizationRequest: string;
                provider: string;
                locale?: string;
            };
        };

        type Result = Promise<{
            url: string;
        }>;

        type Signature = (props: Props) => Result;
    }

    namespace Callback {
        type Props = {
            context: Extract.Meta;
            input: {
                provider: string;
                state: string;
                code: string;
                iss?: string;
            };
        };

        type Result = Promise<MessageResult & { authorizationUrl: string; recoveryCodes?: string[] }>;

        type Signature = (props: Props) => Result;
    }
}
