import { Throttle } from "@nestjs/throttler";
import ms from "ms";

export class SensitiveThrottle {
    public static OtpVerify(): MethodDecorator & ClassDecorator {
        return this.both(5, ms("10m"));
    }

    public static OtpIssue(): MethodDecorator & ClassDecorator {
        return this.both(1, ms("1m"));
    }

    public static TotpVerify(): MethodDecorator & ClassDecorator {
        return this.both(5, ms("5m"));
    }

    public static HighImpactSecret(): MethodDecorator & ClassDecorator {
        return this.both(5, ms("1h"));
    }

    public static PasswordAuth(): MethodDecorator & ClassDecorator {
        return this.both(10, ms("15m"));
    }

    private static both(limit: number, ttl: number): MethodDecorator & ClassDecorator {
        return Throttle({ default: { limit, ttl }, account: { limit, ttl } });
    }
}
