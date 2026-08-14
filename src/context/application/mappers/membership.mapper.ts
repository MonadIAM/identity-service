import { randomUUID } from "node:crypto";

export class MembershipMapper implements Commands.Mappers.Membership.Contract {
    public leaveRequestedPayload(
        props: Commands.Mappers.Membership.LeaveRequestedPayload.Props,
    ): Commands.Mappers.Membership.LeaveRequestedPayload.Result {
        return {
            actor: props.actor,
            realm: props.realm,
            input: {
                account: props.input.account,
                reason: props.input.reason,
                command: "realm.exclude",
                process: randomUUID(),
            },
        };
    }
}
