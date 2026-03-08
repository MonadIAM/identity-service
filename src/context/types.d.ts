declare namespace DeltaAudit {
    type Actor = {
        id: string;
    };

    type FieldPatch<T, K extends keyof T> = {
        old: Optional<T[K]>;
        new: T[K];
    };

    type Patch<T> = {
        [K in keyof T]?: FieldPatch<T, K>;
    };
}
