import { EntityManager } from "@mikro-orm/postgresql";

import { Password as PasswordEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Credential {
            interface Contract {
                changePassword: (props: ChangePassword) => void;
                resetPassword: (props: ResetPassword) => void;
            }

            type ChangePassword = {
                transaction: EntityManager;
                input: {
                    password: PasswordEntity;
                    newHash: string;
                };
            };

            type ResetPassword = {
                transaction: EntityManager;
                input: {
                    password: PasswordEntity;
                    newHash: string;
                };
            };
        }
    }
}
