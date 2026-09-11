import { Collection } from "@mikro-orm/core";

declare global {
    namespace Unit {
        namespace Domain {
            namespace EntityFactory {
                interface Contract {
                    readonly createMembershipHistory: CreateMembershipHistory.Signature;
                    readonly createInterfaceClient: CreateInterfaceClient.Signature;
                    readonly createPasswordHistory: CreatePasswordHistory.Signature;
                    readonly createServiceClient: CreateServiceClient.Signature;
                    readonly createSecondFactor: CreateSecondFactor.Signature;
                    readonly createRecoveryCode: CreateRecoveryCode.Signature;
                    readonly createApplication: CreateApplication.Signature;
                    readonly createMembership: CreateMembership.Signature;
                    readonly createMasterCode: CreateMasterCode.Signature;
                    readonly createIdentifier: CreateIdentifier.Signature;
                    readonly createChangeLog: CreateChangeLog.Signature;
                    readonly createAuditLog: CreateAuditLog.Signature;
                    readonly createPassword: CreatePassword.Signature;
                    readonly collection: CollectionFactory.Signature;
                    readonly createAccount: CreateAccount.Signature;
                    readonly createProfile: CreateProfile.Signature;
                    readonly createSession: CreateSession.Signature;
                    readonly createInvite: CreateInvite.Signature;
                }

                namespace CreateAccount {
                    type Props = Partial<Entities.Account.Contract>;

                    type Result = Entities.Account;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateProfile {
                    type Props = Partial<Entities.Profile.Contract>;

                    type Result = Entities.Profile;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateIdentifier {
                    type Props = Partial<Entities.Identifier.Contract>;

                    type Result = Entities.Identifier;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreatePassword {
                    type Props = Partial<Entities.Password.Contract>;

                    type Result = Entities.Password;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreatePasswordHistory {
                    type Props = Partial<Entities.PasswordHistory.Contract>;

                    type Result = Entities.PasswordHistory;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateRecoveryCode {
                    type Props = Partial<Entities.RecoveryCode.Contract>;

                    type Result = Entities.RecoveryCode;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateMasterCode {
                    type Props = Partial<Entities.MasterCode.Contract>;

                    type Result = Entities.MasterCode;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateSecondFactor {
                    type Props = Partial<Entities.SecondFactor.Contract>;

                    type Result = Entities.SecondFactor;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateSession {
                    type Props = Partial<Entities.Session.Contract>;

                    type Result = Entities.Session;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateApplication {
                    type Props = Partial<Entities.Application.Contract>;

                    type Result = Entities.Application;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateInterfaceClient {
                    type Props = Partial<Entities.InterfaceClient.Contract>;

                    type Result = Entities.InterfaceClient;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateServiceClient {
                    type Props = Partial<Entities.ServiceClient.Contract>;

                    type Result = Entities.ServiceClient;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateInvite {
                    type Props = Partial<Entities.Invite.Contract>;

                    type Result = Entities.Invite;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateMembership {
                    type Props = Partial<Entities.Membership.Contract>;

                    type Result = Entities.Membership;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateMembershipHistory {
                    type Props = Partial<Entities.MembershipHistory.Contract>;

                    type Result = Entities.MembershipHistory;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateAuditLog {
                    type Props = Partial<SystemEntities.AuditLog>;

                    type Result = SystemEntities.AuditLog;

                    type Signature = (props?: Props) => Result;
                }

                namespace CreateChangeLog {
                    type Props = Partial<SystemEntities.ChangeLog>;

                    type Result = SystemEntities.ChangeLog;

                    type Signature = (props?: Props) => Result;
                }

                namespace CollectionFactory {
                    type Props<T extends object> = {
                        readonly items: T[];
                        readonly owner: object;
                    };

                    type Result<T extends object> = Collection<T>;

                    type Signature = <T extends object>(props: Props<T>) => Result<T>;
                }
            }
        }
    }
}
