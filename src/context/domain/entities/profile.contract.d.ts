declare namespace Entities {
    type Profile = Profile.Contract;

    namespace Profile {
        interface Contract {
            updatedAt?: Date;

            displayName: string;
            pictureUrl?: string;
            timeZone?: string;
            locale?: string;

            account: Entities.Account;

            update(patch: Entities.Profile.ChangeDataProps): void;
        }

        type ConstructorProps = {
            account: Entities.Account;
            displayName: string;
            pictureUrl?: string;
            timeZone?: string;
            locale?: string;
        };

        type ChangeDataProps = {
            displayName?: string;
            pictureUrl?: string;
            timeZone?: string;
            locale?: string;
        };
    }
}
