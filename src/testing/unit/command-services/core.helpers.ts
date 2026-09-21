import { jest } from "@jest/globals";

import * as infrastructureTokens from "~context/infrastructure/services/tokens";

import { DomainServiceCoreUnitHelpers } from "../core.helpers";

jest.unstable_mockModule("~context/infrastructure/services", () => infrastructureTokens);

export class ApplicationCommandUnitHelpers
    extends DomainServiceCoreUnitHelpers
    implements Unit.Application.CommandCore.Contract
{
    public execution(): Unit.Application.CommandCore.Execution.Result {
        const transaction = this.transaction();

        const run = jest.fn<TransactionManager.Service.Run.Signature>(
            async <T extends TransactionManager.Service.ResultValue>(
                props: TransactionManager.Service.Run.Props<T>,
            ): TransactionManager.Service.Run.Result<T> => await props.execute(transaction.entityManager),
        );
        const consume = jest.fn<Unit.Application.CommandCore.Consume.Signature>(async (props) => ({
            value: props.execute ? await props.execute(transaction.entityManager) : undefined,
            status: "processed",
        }));

        const emit = jest.fn<TransactionManager.Service.Emit.Signature>(() => Promise.resolve());

        return {
            transactional: this.contract<TransactionManager.Service.PublicContract>({ run, consume, emit }),
            transaction,
            consume,
            emit,
            run,
        };
    }
}
