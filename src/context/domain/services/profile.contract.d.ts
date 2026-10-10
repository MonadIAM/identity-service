declare namespace Services.Profile {
    interface Contract extends CommandContract {}

    interface CommandContract {
        update: Update.Signature;
    }

    namespace Update {
        type Props = {
            transaction: ORM.EntityManager;
            input: {
                patch: Entities.Profile.ChangeDataProps;
                account: string;
            };
        };

        type Result = Promise<void>;

        type Signature = (props: Props) => Result;
    }
}
