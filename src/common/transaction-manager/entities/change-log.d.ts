declare namespace SystemEntities {
    type ChangeLog = ChangeLog.Contract;

    namespace ChangeLog {
        interface Contract {
            id: string;
            createdAt: Date;

            auditEntry: string;

            changeType: ORM.ChangeSetType;
            entityType: string;
            entity: string;

            delta: ValueObjects.DeltaChanges;

            keyVersion?: number;
            signature?: string;

            sign: Sign.Signature;
        }

        type ConstructorProps = {
            delta: ValueObjects.DeltaChanges;
            changeType: ORM.ChangeSetType;
            auditEntry: string;
            entityType: string;
            entity: string;
        };

        namespace Sign {
            type Props = {
                keyVersion: number;
                signature: string;
            };

            type Result = void;

            type Signature = (props: Props) => Result;
        }
    }
}
