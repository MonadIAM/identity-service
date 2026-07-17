/* eslint-disable prettier/prettier */
import { ADMIN_ACCOUNT_ID, USER_ACCOUNT_ID } from "~context/constants";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

const ADMIN_RECOVERY_CODE_1_HASH = "$argon2id$v=19$m=19456,t=2,p=1$FqGQforlAIe7KTF3fYL2XA$jkh8BArVtk5XGCUAUc8M6cawj0RIm52YI6oPG+1NumI";
const ADMIN_RECOVERY_CODE_2_HASH = "$argon2id$v=19$m=19456,t=2,p=1$DnBJZn3gptZ0kGgPJNvLzQ$wd1BGklCtK6fTpqeuVrMSCc2Rs8qL5mswNX6gZoa01c";
const ADMIN_RECOVERY_CODE_3_HASH = "$argon2id$v=19$m=19456,t=2,p=1$i7vDzegh9RtHy/zlz12pog$wUitTpKq8wXKPp+aoutqXXMVx0SXr2ayYohxGo2Hu80";
const ADMIN_RECOVERY_CODE_4_HASH = "$argon2id$v=19$m=19456,t=2,p=1$KAMiHhyv/hqPC/d81JbHBQ$lfBRcpFWrkKizr9QMGKbjJmHRv0os26OIyXcsbTtiwU";
const ADMIN_RECOVERY_CODE_5_HASH = "$argon2id$v=19$m=19456,t=2,p=1$A+hKbAc89SzK6W21ay94QQ$YlKSELglA11A1MoFFAgzpHcMvRuCKJp7bX0EYbQilXk";
const ADMIN_RECOVERY_CODE_6_HASH = "$argon2id$v=19$m=19456,t=2,p=1$x2xtWGWYNStRKGzniN1tSQ$E2h9c8Oj3f3hA01+AR3ukRq62Hmd6JxMx9vT6bXuPus";
const ADMIN_RECOVERY_CODE_7_HASH = "$argon2id$v=19$m=19456,t=2,p=1$B8IITyfl5vX/9juhDkzP7A$PiVD44WnEHP3tiABMH8qK8wpD+RhFK9xVrYxGCH7qzQ";
const ADMIN_RECOVERY_CODE_8_HASH = "$argon2id$v=19$m=19456,t=2,p=1$61JgwxCiRwoXEzKx5p1e0Q$LvGbg2kRPKB7S5x7nWUgS+uOevoJBK7/RNnR4IPVqDs";
// "27E6-4F3F", "36A6-5214", "FBBE-C584", "1BBC-EB91", "C0EC-BBAE", "40A3-8BFC", "AB67-D15D", "428D-3738"

const USER_RECOVERY_CODE_1_HASH = "$argon2id$v=19$m=19456,t=2,p=1$/iC6Prt+KFVzt99ei0vfww$djPmHXQvYMnbwL2MY+50TG51VFHNJmMmLaQW8A97NzE";
const USER_RECOVERY_CODE_2_HASH = "$argon2id$v=19$m=19456,t=2,p=1$BOvl09guLxuThixGq6AMIw$xrpS6bNWuxf1CYAgaHP2YmNe/MgYJbVzxjsU0K0jQ/c";
const USER_RECOVERY_CODE_3_HASH = "$argon2id$v=19$m=19456,t=2,p=1$fhCWVouKblr5w86zB4Ucsw$uyarU6VoVurIPcqCtD824Qc/TEepJzefLzSoQ8aBGMs";
const USER_RECOVERY_CODE_4_HASH = "$argon2id$v=19$m=19456,t=2,p=1$5AqKnOU+6IqU6WJpv2C4Eg$ufVwc8oOsuC3NhGUHl1C8ZtwrpeyCwG0ookjOeGfpfI";
const USER_RECOVERY_CODE_5_HASH = "$argon2id$v=19$m=19456,t=2,p=1$4qAFTlfz8kRYDpzubnaMcg$0tcbUYEjxcLqHV3VrP+a4+L5MtgX1A+E2zGxosEgTqQ";
const USER_RECOVERY_CODE_6_HASH = "$argon2id$v=19$m=19456,t=2,p=1$qgyrgT+9yg8mR6bSxONltg$rx8M6ij/tXDIpZArkvYO+CckotR2LURHHUL8k1DFYEY";
const USER_RECOVERY_CODE_7_HASH = "$argon2id$v=19$m=19456,t=2,p=1$92JwMZwwcg7PdhAWftW92Q$MlIQbeU8BwbN179y85U5Hq93I+i3AXgnlHCo603kIYU";
const USER_RECOVERY_CODE_8_HASH = "$argon2id$v=19$m=19456,t=2,p=1$YKmXaetPzM8bYLq2ND04uw$/t3glrAUrPYMJTG35z2Qn418Ibpx6VR+9s9rcB83+6s";
// "27E6-4F3F", "36A6-5214", "FBBE-C584", "1BBC-EB91", "C0EC-BBAE", "40A3-8BFC", "AB67-D15D", "428D-3738"

export const RecoveryCodes = [
    {
        id: "00000002-0000-4000-8000-100000000001",
        account_id: ADMIN_ACCOUNT_ID,
        hash: ADMIN_RECOVERY_CODE_1_HASH,
        used_at: null,
        created_at: CREATED_AT,
    },
    {
        id: "00000002-0000-4000-8000-100000000002",
        account_id: ADMIN_ACCOUNT_ID,
        hash: ADMIN_RECOVERY_CODE_2_HASH,
        used_at: null,
        created_at: CREATED_AT,
    },
    {
        id: "00000002-0000-4000-8000-100000000003",
        account_id: ADMIN_ACCOUNT_ID,
        hash: ADMIN_RECOVERY_CODE_3_HASH,
        used_at: null,
        created_at: CREATED_AT,
    },
    {
        id: "00000002-0000-4000-8000-100000000004",
        account_id: ADMIN_ACCOUNT_ID,
        hash: ADMIN_RECOVERY_CODE_4_HASH,
        used_at: null,
        created_at: CREATED_AT,
    },
    {
        id: "00000002-0000-4000-8000-100000000005",
        account_id: ADMIN_ACCOUNT_ID,
        hash: ADMIN_RECOVERY_CODE_5_HASH,
        used_at: null,
        created_at: CREATED_AT,
    },
    {
        id: "00000002-0000-4000-8000-100000000006",
        account_id: ADMIN_ACCOUNT_ID,
        hash: ADMIN_RECOVERY_CODE_6_HASH,
        used_at: null,
        created_at: CREATED_AT,
    },
    {
        id: "00000002-0000-4000-8000-100000000007",
        account_id: ADMIN_ACCOUNT_ID,
        hash: ADMIN_RECOVERY_CODE_7_HASH,
        used_at: null,
        created_at: CREATED_AT,
    },
    {
        id: "00000002-0000-4000-8000-100000000008",
        account_id: ADMIN_ACCOUNT_ID,
        hash: ADMIN_RECOVERY_CODE_8_HASH,
        used_at: null,
        created_at: CREATED_AT,
    },
    {
        id: "00000002-0000-4000-8000-100000000009",
        account_id: USER_ACCOUNT_ID,
        hash: USER_RECOVERY_CODE_1_HASH,
        used_at: null,
        created_at: CREATED_AT,
    },
    {
        id: "00000002-0000-4000-8000-100000000010",
        account_id: USER_ACCOUNT_ID,
        hash: USER_RECOVERY_CODE_2_HASH,
        used_at: null,
        created_at: CREATED_AT,
    },
    {
        id: "00000002-0000-4000-8000-100000000011",
        account_id: USER_ACCOUNT_ID,
        hash: USER_RECOVERY_CODE_3_HASH,
        used_at: null,
        created_at: CREATED_AT,
    },
    {
        id: "00000002-0000-4000-8000-100000000012",
        account_id: USER_ACCOUNT_ID,
        hash: USER_RECOVERY_CODE_4_HASH,
        used_at: null,
        created_at: CREATED_AT,
    },
    {
        id: "00000002-0000-4000-8000-100000000013",
        account_id: USER_ACCOUNT_ID,
        hash: USER_RECOVERY_CODE_5_HASH,
        used_at: null,
        created_at: CREATED_AT,
    },
    {
        id: "00000002-0000-4000-8000-100000000014",
        account_id: USER_ACCOUNT_ID,
        hash: USER_RECOVERY_CODE_6_HASH,
        used_at: null,
        created_at: CREATED_AT,
    },
    {
        id: "00000002-0000-4000-8000-100000000015",
        account_id: USER_ACCOUNT_ID,
        hash: USER_RECOVERY_CODE_7_HASH,
        used_at: null,
        created_at: CREATED_AT,
    },
    {
        id: "00000002-0000-4000-8000-100000000016",
        account_id: USER_ACCOUNT_ID,
        hash: USER_RECOVERY_CODE_8_HASH,
        used_at: null,
        created_at: CREATED_AT,
    },
];
