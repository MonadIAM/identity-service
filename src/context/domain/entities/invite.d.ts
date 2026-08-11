import { InviteStatus } from "~context/enums";

declare global {
    namespace Entities {
        type Invite = Invite.Contract;

        namespace Invite {
            interface Contract {
                id: string;
                createdAt: Date;
                updatedAt?: Date;
                version: number;

                status: InviteStatus;
                invitee: Entities.Account;
                inviter: Entities.Account;
                realm: string;
                role: string;

                invalidate(): void;
                decline(): void;
                cancel(): void;
                accept(): void;
                expire(): void;
            }

            type ConstructorProps = {
                invitee: Entities.Account;
                inviter: Entities.Account;
                realm: string;
                role: string;
            };
        }
    }
}
