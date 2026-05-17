import { Injectable, Scope } from "@nestjs/common";

@Injectable({ scope: Scope.DEFAULT })
export class ProfileService implements Services.Profile.Contract {
    public update(props: Services.Profile.Update.Props): Services.Profile.Update.Result {
        const { input } = props;
        input.profile.update(input.patch);
    }
}
