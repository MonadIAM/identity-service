import { Injectable, Scope } from "@nestjs/common";

@Injectable({ scope: Scope.DEFAULT })
export class ProfileService implements Services.Profile.Contract {
    public update({ input }: Services.Profile.Update): void {
        input.profile.update(input.patch);
    }
}
