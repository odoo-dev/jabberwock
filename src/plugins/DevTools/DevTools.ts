import { DevToolsComponent } from './components/DevToolsComponent';
import { JWOwlUIPlugin } from '../../ui/JWOwlUIPlugin';
import devtoolsTemplates from './DevTools.xml';

export class DevTools extends JWOwlUIPlugin {
    constructor() {
        super();
        this.componentsRegistry.push(DevToolsComponent);
        this.templates = devtoolsTemplates;
    }
}
