import { ADMIN_ACCOUNT_ID, USER_ACCOUNT_ID } from "~context/constants";

const dataset = [
    {
        account_id: ADMIN_ACCOUNT_ID,
        display_name: "Administrator",
        locale: "en-US",
        time_zone: "UTC",
        picture_url: null,
        updated_at: null,
    },
    {
        account_id: USER_ACCOUNT_ID,
        display_name: "John Doe",
        locale: "en-US",
        time_zone: "UTC",
        picture_url: null,
        updated_at: null,
    },
];

export const Profiles = {
    postgresql: dataset,
    name: "profile",
};
