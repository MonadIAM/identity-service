import { SecondFactorType } from "~context/enums";

declare global {
    namespace Services {
        namespace SecondFactor {
            interface Contract extends PublicContract, InternalContract {}

            interface CommandContract extends PublicContract {}

            interface InternalContract {
                acceptCode: AcceptCode.Signature;
            }

            namespace AcceptCode {
                type Props = {
                    input: {
                        factor: Entities.SecondFactor;
                        code: string;
                    };
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            interface PublicContract {
                reauthenticate: Reauthenticate.Signature;
                authenticate: Authenticate.Signature;
                create: Create.Signature;
                verify: Verify.Signature;
                purge: Purge.Signature;
                reset: Reset.Signature;
            }

            namespace Create {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        type: SecondFactorType;
                        account: string;
                        secret: string;
                        name: string;
                    };
                };

                type Result = Promise<Entities.SecondFactor>;

                type Signature = (props: Props) => Result;
            }

            namespace Verify {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        masterCodeHash: string;
                        account: string;
                        factor: string;
                        code: string;
                    };
                };

                type Result = Promise<Entities.SecondFactor>;

                type Signature = (props: Props) => Result;
            }

            namespace Authenticate {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        account: string;
                        code: string;
                    };
                };

                type Result = Promise<Entities.SecondFactor>;

                type Signature = (props: Props) => Result;
            }

            namespace Reauthenticate {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        account: string;
                        code: string;
                    };
                };

                type Result = Promise<Entities.SecondFactor>;

                type Signature = (props: Props) => Result;
            }

            namespace Purge {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        account: string;
                        target: string;
                    };
                };

                type Result = Promise<void>;

                type Signature = (props: Props) => Result;
            }

            namespace Reset {
                type Props = {
                    transaction: ORM.EntityManager;
                    input: {
                        identifier: string;
                        code: string;
                    };
                };

                type Result = Promise<Entities.Account>;

                type Signature = (props: Props) => Result;
            }
        }
    }
}
