import { DevToolsComponent } from './components/DevToolsComponent';
import { JWOwlUIPlugin } from '../../ui/JWOwlUIPlugin';
import devtoolsTemplates from './DevTools.xml';
import { OwlUIComponent } from '../../ui/OwlUIComponent';

export class DevTools extends JWOwlUIPlugin {
    static templates = devtoolsTemplates;
    Components = [DevToolsComponent as typeof OwlUIComponent];
}
