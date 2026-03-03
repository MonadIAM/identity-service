import { AccountSubject, AccountStatus } from "~context/enums";

declare global {
    namespace Entities {
        namespace Account {
            type ConstructorProps = {
                subject: AccountSubject;
                status: AccountStatus;
            };
        }
    }
}
