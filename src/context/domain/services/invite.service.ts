import { Injectable, Scope } from "@nestjs/common";

import { Invite } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class InviteService implements Services.Invite.Contract {
    public create(props: Services.Invite.Create.Props): Services.Invite.Create.Result {
        const { transaction, input } = props;
        const entity = new Invite(input);

        transaction.persist(entity);

        return entity;
    }

    public accept(props: Services.Invite.Accept.Props): Services.Invite.Accept.Result {
        props.entity.accept();
    }

    public decline(props: Services.Invite.Decline.Props): Services.Invite.Decline.Result {
        props.entity.decline();
    }

    public cancel(props: Services.Invite.Cancel.Props): Services.Invite.Cancel.Result {
        props.entity.cancel();
    }

    public expire(props: Services.Invite.Expire.Props): Services.Invite.Expire.Result {
        props.entity.expire();
    }

    public invalidate(props: Services.Invite.Invalidate.Props): Services.Invite.Invalidate.Result {
        props.entity.invalidate();
    }
}
