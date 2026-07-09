---@diagnostic disable: undefined-global

local payload = cjson.decode(ARGV[1])

if redis.call("EXISTS", KEYS[2]) == 1 then
    return cjson.encode({ status = "collision" })
end

local raw = redis.call("GET", KEYS[1])

if not raw then
    return cjson.encode({ status = "missing" })
end

local request = cjson.decode(raw)
local code = cjson.encode({
    codeChallengeMethod = request.codeChallengeMethod,
    codeChallenge = request.codeChallenge,
    redirectUri = request.redirectUri,
    account = payload.account,
    client = request.client,
    acr = payload.acr
})

redis.call("SET", KEYS[2], code, "EX", tostring(payload.ttl))
redis.call("DEL", KEYS[1])

return cjson.encode({
    status = "issued",
    request = request
})
