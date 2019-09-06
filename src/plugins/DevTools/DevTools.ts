import { DevToolsComponent } from './components/DevToolsComponent.js';
import { JWOwlUIPlugin } from '../../ui/JWOwlUIPlugin.js';

export class DevTools extends JWOwlUIPlugin {
    constructor() {
        super();
        this.componentsRegistry.push(DevToolsComponent);
        const path = '/src/plugins/DevTools/';
        this.templates = path + 'DevTools.xml'; // todo: automize path
    }
}
