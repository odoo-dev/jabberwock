import { DevToolsComponent } from './components/DevToolsComponent';
import { JWOwlUIPlugin } from '../../owl-ui/src/JWOwlUIPlugin';
import devtoolsTemplates from '../assets/DevTools.xml';
import { OwlUIComponent } from '../../owl-ui/src/OwlUIComponent';
import '../assets/DevTools.css';

export class DevTools extends JWOwlUIPlugin {
    static templates = devtoolsTemplates;
    Components = [DevToolsComponent as typeof OwlUIComponent];
}
