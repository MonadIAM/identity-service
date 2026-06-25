export enum LuaScript {
    ISSUE_CODE = "issue-code",
}

export const LUA_SCRIPT_FILES: Record<LuaScript, string> = {
    [LuaScript.ISSUE_CODE]: "issue-code.lua",
};
