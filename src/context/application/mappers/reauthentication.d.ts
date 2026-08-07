declare namespace Commands {
    namespace Mappers {
        namespace Reauthentication {
            interface Contract extends PublicContract {}

            interface PublicContract {
                grantPayload: GrantPayload.Signature;
            }

            namespace GrantPayload {
                type Props = {
                    expiresAt: number;
                    session: string;
                };

                type Result = {
                    expiresAt: number;
                    session: string;
                };

                type Signature = (props: Props) => Result;
            }
        }
    }
}
