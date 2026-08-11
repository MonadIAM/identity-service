import { randomUUID } from "node:crypto";

export class MembershipMapper implements Commands.Mappers.Membership.Contract {
    public leaveRequestedPayload(
        props: Commands.Mappers.Membership.LeaveRequestedPayload.Props,
    ): Commands.Mappers.Membership.LeaveRequestedPayload.Result {
        return {
            account: props.input.account,
            reason: props.input.reason,
            requestedBy: props.actor,
            command: "realm.exclude",
            process: randomUUID(),
            realm: props.realm,
        };
    }
}
