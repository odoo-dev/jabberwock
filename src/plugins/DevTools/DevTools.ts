import { DevToolsComponent } from './components/DevToolsComponent';
import { JWOwlUIPlugin } from '../../ui/JWOwlUIPlugin';
import devtoolsTemplates from './DevTools.xml';

export class DevTools extends JWOwlUIPlugin {
    componentsRegistry = this.componentsRegistry.concat(DevToolsComponent);
    templates = devtoolsTemplates;
}
