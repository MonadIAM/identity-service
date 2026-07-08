/* eslint-disable prettier/prettier */
import { AccountStatus, AccountSubject } from "~context/enums";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

export const ADMIN_ACCOUNT_ID = "00000000-0000-4000-8000-000000000001";
export const USER_ACCOUNT_ID  = "00000000-0000-4000-8000-100000000002";

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
