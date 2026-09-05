export abstract class ReferenceAutomation {
    private constructor() {}

    public static readonly customFetch: Bootstrap.Reference.Automation.FetchCallback = async (input, init) => {
        const authnPathPattern = /\/api\/v\d+\/authn\/(?:password|request\/otp|verify\/otp|verify\/2fa)$/;
        const authorizationRequestQueryParam = "authorizationRequest";
        const authorizationUrlProperty = "authorizationUrl";
        const contentTypeJson = "application/json";
        const docsCallbackPath = "/docs/";
        const redirectHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

        const request = new Request(input, init);
        const requestUrl = new URL(request.url, window.location.href);
        const authnRequest = request.method.toUpperCase() === "POST" && authnPathPattern.test(requestUrl.pathname);
        let outgoingRequest = request;

        if (authnRequest) {
            const authorizationRequest = new URLSearchParams(window.location.search).get(authorizationRequestQueryParam);
            const contentType = request.headers.get("content-type") ?? "";
            const rawBody = await request.clone().text();

            if (authorizationRequest && contentType.includes(contentTypeJson) && rawBody.length > 0) {
                const body: unknown = JSON.parse(rawBody);

                if (isJsonObject(body) && "authorizationRequest" in body && !body.authorizationRequest) {
                    body.authorizationRequest = authorizationRequest;

                    const headers = new Headers(request.headers);
                    headers.set("content-type", contentTypeJson);

                    outgoingRequest = new Request(request, {
                        body: JSON.stringify(body),
                        headers,
                    });
                }
            }
        }

        const response = await fetch(outgoingRequest);
        const responseContentType = response.headers.get("content-type") ?? "";

        if (authnRequest && response.ok && responseContentType.includes(contentTypeJson)) {
            const body: unknown = await response.clone().json();

            if (isJsonObject(body) && typeof body[authorizationUrlProperty] === "string") {
                const redirectUrl = new URL(body[authorizationUrlProperty], window.location.href);
                const trustedHost = redirectHosts.has(redirectUrl.hostname);
                const docsCallback = redirectUrl.pathname === docsCallbackPath;

                if (trustedHost && docsCallback) {
                    window.location.assign(redirectUrl.toString());
                }
            }
        }

        return response;

        function isJsonObject(value: unknown): value is Bootstrap.Reference.Automation.JsonObject {
            return typeof value === "object" && value !== null && !Array.isArray(value);
        }
    };
}
