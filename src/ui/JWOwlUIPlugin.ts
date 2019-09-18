import { OwlUIComponent } from './OwlUIComponent';

export class JWOwlUIPlugin {
    templates: string;
    componentsRegistry: Array<typeof OwlUIComponent> = [];
}
