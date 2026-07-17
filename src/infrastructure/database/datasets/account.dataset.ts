import { ADMIN_ACCOUNT_ID, USER_ACCOUNT_ID } from "~context/constants";
import { AccountStatus, AccountSubject } from "~context/enums";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

export const Accounts = [
    {
        id: ADMIN_ACCOUNT_ID,
        subject: AccountSubject.HUMAN,
        status: AccountStatus.ACTIVE,
        is2faenforced: false,
        created_at: CREATED_AT,
        updated_at: null,
        version: 1,
    },
    {
        id: USER_ACCOUNT_ID,
        subject: AccountSubject.HUMAN,
        status: AccountStatus.ACTIVE,
        is2faenforced: false,
        created_at: CREATED_AT,
        updated_at: null,
        version: 1,
    },
];
