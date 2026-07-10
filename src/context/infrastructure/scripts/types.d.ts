import { CodeChallengeMethod } from "~context/enums";

declare global {
    namespace Scripts {
        namespace IssueCode {
            type Request = {
                codeChallengeMethod: CodeChallengeMethod.S256;
                codeChallenge: string;
                redirectUri: string;
                client: string;
                state: string;
                scope: string;
                nonce?: string;
            };

            type Props = {
                account: string;
                acr: string;
                ttl: number;
            };

            type Result = { status: "collision" | "missing" } | { status: "issued"; request: Request };
        }
    }
}
