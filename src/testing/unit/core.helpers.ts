import { ConfigService } from "@nestjs/config";
import { jest } from "@jest/globals";

import { ServiceMockBank } from "./service-mock-bank.helpers";

export class DomainServiceCoreUnitHelpers extends ServiceMockBank implements Unit.Domain.Core.Contract {
    public transaction(): Unit.Domain.Core.Transaction {
        const flush = jest.fn(() => Promise.resolve());
        const persist = jest.fn<(entity: object) => void>();
        const remove = jest.fn();
        const clear = jest.fn();
        const merge = jest.fn();

        return {
            entityManager: this.contract<ORM.EntityManager>({ persist, remove, flush, clear, merge }),
            persist,
            remove,
            flush,
            clear,
            merge,
        };
    }

    public config(props: Unit.Domain.Core.Config.Props = {}): ConfigService {
        return this.contract<ConfigService>({
            getOrThrow: jest.fn((key: string) => props.values?.[key]),
        });
    }

    protected contract<T>(value: object): T {
        return value as T;
    }
}
