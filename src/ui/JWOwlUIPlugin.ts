import { Env, Component } from 'owl-framework/src/component/component';

class OwlUIComponent extends Component<Env, {}, {}> {}

export class JWOwlUIPlugin {
    templates: string;
    componentsRegistry: Array<typeof OwlUIComponent>;

    constructor() {
        this.componentsRegistry = [];
    }
}
