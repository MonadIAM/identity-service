declare namespace Commands {
    namespace Session {
        interface Contract extends PublicContract {}

        interface PublicContract {
            revokeAll: RevokeAll.Signature;
            refresh: Refresh.Signature;
            create: Create.Signature;
            revoke: Revoke.Signature;
        }

        interface CommandsContract extends Pick<PublicContract, "refresh" | "create" | "revoke"> {}

        interface ControllerContract extends Pick<PublicContract, "revokeAll" | "revoke"> {}

        namespace RevokeAll {
            type Props = {
                context: Extract.Meta;
                actor: string;
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }

        namespace Refresh {
            type Props = {
                context: Extract.Meta;
                input: {
                    client: string;
                    refreshToken?: string;
                };
            };

            type ExecuteResult =
                | { kind: "ROTATED"; accessToken: string; refreshToken: string }
                | { kind: "REUSE_DETECTED"; sessions: Entities.Session[] }
                | { kind: "REPLAYED"; result: Awaited<Result> };

            type Result = Promise<MessageResult & Services.Session.Create.Tokens>;

            type Signature = (props: Props) => Result;
        }

        namespace Create {
            type Props = {
                context: Extract.Meta;
                input: {
                    realms: string[];
                    account: string;
                    client: string;
                    nonce?: string;
                    scope: string;
                    acr: string;
                };
            };

            type Result = Promise<Services.Session.Create.Tokens>;

            type Signature = (props: Props) => Result;
        }

        namespace Revoke {
            type Props = {
                input: { token: string } | { sessions?: string[] };
                context: Extract.Meta;
                session: string;
                actor: string;
            };

            type Result = Promise<MessageResult>;

            type Signature = (props: Props) => Result;
        }
    }
}
