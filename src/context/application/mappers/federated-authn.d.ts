declare namespace Mappers {
    namespace FederatedAuthn {
        interface Contract extends PublicContract {}

        interface PublicContract {
            blacklistPayload: BlacklistPayload.Signature;
        }

        namespace BlacklistPayload {
            type Props = Awaited<Services.Session.Create.Result>;

            type Result = Topics.Blacklist.Message["payload"][];

            type Signature = (props: Props) => Result;
        }
    }
}
