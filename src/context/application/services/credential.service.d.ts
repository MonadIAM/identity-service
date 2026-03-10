import { EntityManager } from "@mikro-orm/postgresql";

import { Password as PasswordEntity } from "~context/domain/entities";

declare global {
    namespace Services {
        namespace Credential {
            interface Contract {
                changePassword: (props: ChangePassword) => Promise<void>;
                resetPassword: (props: ResetPassword) => Promise<void>;
            }

            type ChangePassword = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    password: PasswordEntity;
                    newHash: string;
                };
            };

            type ResetPassword = {
                transaction: EntityManager;
                context: RequestContext;
                input: {
                    password: PasswordEntity;
                    newHash: string;
                };
            };
        }
    }
}
