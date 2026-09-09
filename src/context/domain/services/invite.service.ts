import { Inject, Injectable, Scope } from "@nestjs/common";

import { ACCOUNT_REPOSITORY, INVITE_REPOSITORY, MEMBERSHIP_REPOSITORY } from "~context/infrastructure/repositories";
import { Exception } from "~common/exceptions";
import { InviteStatus } from "~context/enums";

import { Invite } from "../entities";

@Injectable({ scope: Scope.DEFAULT })
export class InviteService implements Services.Invite.Contract {
    private readonly dictionaryPath = "services.invite";

    public constructor(
        @Inject(MEMBERSHIP_REPOSITORY)
        private readonly membershipRepository: Repositories.Membership.PublicContract,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: Repositories.Account.PublicContract,
        @Inject(INVITE_REPOSITORY)
        private readonly inviteRepository: Repositories.Invite.PublicContract,
    ) {}

    public async create(props: Services.Invite.Create.Props): Services.Invite.Create.Result {
        const { transaction, input } = props;
        const [invitee, inviter] = await Promise.all([
            this.accountRepository.findUniqueOrThrow({
                where: { id: input.invitee },
                transaction,
            }),
            this.accountRepository.findUniqueOrThrow({
                where: { id: input.inviter },
                transaction,
            }),
        ]);

        const membership = await this.membershipRepository.findUnique({
            where: { account: invitee, realm: input.realm },
            transaction,
        });

        if (membership) {
            throw Exception.conflict({ messageKey: `${this.dictionaryPath}.INVITEE_ALREADY_MEMBER` });
        } else {
            const entity = new Invite({ role: input.role, realm: input.realm, invitee, inviter });
            transaction.persist(entity);
            return entity;
        }
    }

    public async accept(props: Services.Invite.Accept.Props): Services.Invite.Accept.Result {
        const { transaction, input } = props;
        const entity = await this.inviteRepository.findUniqueOrThrow({
            where: { id: input.invite, invitee: input.invitee },
            transaction,
        });

        if (entity.status === InviteStatus.PENDING) {
            const membership = await this.membershipRepository.findUnique({
                where: { account: input.invitee, realm: entity.realm },
                transaction,
            });

            if (membership) {
                throw Exception.conflict({ messageKey: `${this.dictionaryPath}.INVITEE_ALREADY_MEMBER` });
            } else {
                return entity;
            }
        } else {
            throw Exception.invariantViolation({ messageKey: "entities.invite.CANNOT_ACCEPT_INACTIVE" });
        }
    }

    public async decline(props: Services.Invite.Decline.Props): Services.Invite.Decline.Result {
        const { transaction, input } = props;
        const entity = await this.inviteRepository.findUniqueOrThrow({
            where: { id: input.invite, invitee: input.invitee },
            transaction,
        });

        entity.decline();

        return entity;
    }

    public async cancel(props: Services.Invite.Cancel.Props): Services.Invite.Cancel.Result {
        const { transaction, input } = props;

        if ("inviter" in input) {
            const entity = await this.inviteRepository.findUniqueOrThrow({
                where: { id: input.invite, inviter: input.inviter },
                transaction,
            });

            entity.cancel();

            return entity;
        } else {
            const entity = await this.inviteRepository.findUniqueOrThrow({
                where: { id: input.invite },
                transaction,
            });

            if (entity.status === InviteStatus.PENDING) {
                entity.cancel();
            }

            return entity;
        }
    }

    public async invalidatePending(
        props: Services.Invite.InvalidatePending.Props,
    ): Services.Invite.InvalidatePending.Result {
        const { transaction, input } = props;
        const entities = await this.inviteRepository.find({
            where: {
                status: InviteStatus.PENDING,
                $or: [{ invitee: input.account }, { inviter: input.account }],
            },
            transaction,
        });

        for (const entity of entities) {
            entity.invalidate();
        }

        return entities;
    }

    public async expire(props: Services.Invite.Expire.Props): Services.Invite.Expire.Result {
        const { transaction, input } = props;
        const entities = await this.inviteRepository.find({
            where: { status: InviteStatus.PENDING, createdAt: { $lt: input.expirationDate } },
            options: { limit: input.batchSize },
            transaction,
        });

        for (const entity of entities) {
            entity.expire();
        }

        return entities;
    }
}
