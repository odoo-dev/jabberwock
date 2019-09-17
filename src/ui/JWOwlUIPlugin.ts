import { OwlUIComponent } from './OwlUIComponent';
import { JWPlugin } from '../core/JWPlugin';

export class JWOwlUIPlugin extends JWPlugin {
    templates: string;
    componentsRegistry: Array<typeof OwlUIComponent> = [];
}
