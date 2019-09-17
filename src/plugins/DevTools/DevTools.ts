import { DevToolsComponent } from './components/DevToolsComponent';
import { JWOwlUIPlugin } from '../../ui/JWOwlUIPlugin';
import devtoolsTemplates from './DevTools.xml';
import { OwlUIComponent } from '../../ui/OwlUIComponent';
import { Dispatcher } from '../../core/dispatcher/Dispatcher';

export class DevTools extends JWOwlUIPlugin {
    constructor(dispatcher: Dispatcher) {
        super(dispatcher);
        this.componentsRegistry.push(DevToolsComponent as typeof OwlUIComponent);
        this.templates = devtoolsTemplates;
    }
}
