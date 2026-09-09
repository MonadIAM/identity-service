declare namespace Services {
    namespace InterfaceClient {
        interface Contract extends InternalContract, CommandContract {}

        interface InternalContract {
            validateRedirectUris: ValidateRedirectUris.Signature;
            validateRedirectUri: ValidateRedirectUri.Signature;
            validateAuthAddress: ValidateAuthAddress.Signature;
        }

        namespace ValidateRedirectUris {
            type Props = {
                redirectUris: string[];
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace ValidateRedirectUri {
            type Props = {
                redirectUri: string;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        namespace ValidateAuthAddress {
            type Props = {
                authAddress: string;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }

        interface CommandContract {
            restore: Restore.Signature;
            create: Create.Signature;
            update: Update.Signature;
            revoke: Revoke.Signature;
            purge: Purge.Signature;
        }

        namespace Restore {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
                realm: string;
            };

            type Result = Promise<Entities.InterfaceClient[]>;

            type Signature = (props: Props) => Result;
        }

        namespace Create {
            type Props = {
                transaction: ORM.EntityManager;
                realm: string;
                input: {
                    description?: string;
                    application: string;
                    redirectUris: string[];
                    authAddress: string;
                    name: string;
                };
            };

            type Result = Promise<Entities.InterfaceClient>;

            type Signature = (props: Props) => Result;
        }

        namespace Update {
            type Props = {
                transaction: ORM.EntityManager;
                patch: {
                    redirectUris?: string[];
                    authAddress?: string;
                    description?: string;
                    name?: string;
                };
                realm: string;
                id: string;
            };

            type Result = Promise<void>;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
                realm: string;
            };

            type Result = Promise<Entities.InterfaceClient[]>;

            type Signature = (props: Props) => Result;
        }

        namespace Purge {
            type Props = {
                transaction: ORM.EntityManager;
                identifiers: string[];
                realm: string;
            };

            type Result = Promise<Entities.InterfaceClient[]>;

            type Signature = (props: Props) => Result;
        }
    }
}
