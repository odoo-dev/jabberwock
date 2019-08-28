import { DevToolsComponent } from './components/DevToolsComponent';
import { JWOwlUIPlugin } from '../../ui/JWOwlUIPlugin';

export class DevTools extends JWOwlUIPlugin {
    constructor() {
        super();
        this.componentsRegistry.push(DevToolsComponent);
        const path = '/src/plugins/DevTools/';
        this.templates = path + 'DevTools.xml'; // todo: automize path
    }
};
