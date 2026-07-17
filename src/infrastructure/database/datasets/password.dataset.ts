/* eslint-disable prettier/prettier */
import { ADMIN_ACCOUNT_ID, USER_ACCOUNT_ID } from "~context/constants";

const SET_AT = new Date("2026-01-01T00:00:00.000Z");

const ADMIN_PASSWORD_HASH = "$argon2id$v=19$m=19456,t=2,p=1$rcpl7qT7bMOCJiy2alFrVw$YuoGApbm6hEz7lvZK6cUwflPiHibHp1O83vfm5LToGA"; // Test1234!
const USER_PASSWORD_HASH  = "$argon2id$v=19$m=19456,t=2,p=1$rcpl7qT7bMOCJiy2alFrVw$YuoGApbm6hEz7lvZK6cUwflPiHibHp1O83vfm5LToGA"; // Test1234!

export const Passwords = [
    {
        account_id: ADMIN_ACCOUNT_ID,
        hash: ADMIN_PASSWORD_HASH,
        set_at: SET_AT,
        version: 1,
    },
    {
        account_id: USER_ACCOUNT_ID,
        hash: USER_PASSWORD_HASH,
        set_at: SET_AT,
        version: 1,
    },
];
