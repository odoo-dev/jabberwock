import { DevToolsComponent } from './components/DevToolsComponent';
import { JWOwlUIPlugin } from '../../ui/JWOwlUIPlugin';
import devtoolsTemplates from './DevTools.xml';
import { OwlUIComponent } from '../../ui/OwlUIComponent';

export class DevTools extends JWOwlUIPlugin {
    constructor() {
        super();
        this.componentsRegistry.push(DevToolsComponent as typeof OwlUIComponent);
        this.templates = devtoolsTemplates;
    }
}
