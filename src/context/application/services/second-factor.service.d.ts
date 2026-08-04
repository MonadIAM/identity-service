import { SecondFactorType } from "~context/enums";

declare global {
    namespace Services {
        namespace SecondFactor {
            interface Contract extends PublicContract {}

            interface PublicContract {
                create: Create.Signature;
                rewrap: Rewrap.Signature;
                verify: Verify.Signature;
                purge: Purge.Signature;
                reset: Reset.Signature;
            }

            interface QueryContract extends Pick<PublicContract, "rewrap"> {}

            interface CommandContract extends PublicContract {}

            namespace Create {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        account: Entities.Account;
                        type: SecondFactorType;
                        secret: string;
                        name: string;
                    };
                };

                type Result = Entities.SecondFactor;

                type Signature = (props: Props) => Result;
            }

            namespace Verify {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        factor: Entities.SecondFactor;
                        masterCodeHash: string;
                    };
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Rewrap {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        factor: Entities.SecondFactor;
                        secret: string;
                    };
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Purge {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        factors: Entities.SecondFactor[];
                        target: string;
                    };
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }

            namespace Reset {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        account: Entities.Account;
                    };
                };

                type Result = void;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
