declare namespace SystemEntities {
    type AuditLog = AuditLog.Contract;

    namespace AuditLog {
        interface Contract {
            id: string;
            createdAt: Date;

            actionType: string;
            entityType: string;

            realm?: string;
            actor?: string;

            ip?: string;
            userAgent?: string;

            input?: UnknownObject;
            keyVersion?: number;
            signature?: string;

            sign: Sign.Signature;
        }

        type ConstructorProps = {
            input?: UnknownObject;
            context: Extract.Meta;
            actionType: string;
            entityType: string;
            actor?: string;
            realm?: string;
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
