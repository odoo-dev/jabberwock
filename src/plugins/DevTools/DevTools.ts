import { DevToolsComponent } from './components/DevToolsComponent';
import { JWOwlUIPlugin } from '../../ui/JWOwlUIPlugin';
import devtoolsTemplates from './DevTools.xml';
import { OwlUIComponent } from '../../ui/OwlUIComponent';
import { OwlUIEnv } from '../../ui/OwlUI';

export class DevTools extends JWOwlUIPlugin {
    static templates = devtoolsTemplates;
    Components = [DevToolsComponent as typeof OwlUIComponent];
    constructor(env: OwlUIEnv) {
        super(env);
        this._mountAndRegisterComponents(); // called instead of init
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Mount and register all components.
     */
    _mountAndRegisterComponents(): void {
        const components = this._instantiateComponents(this.Components);
        this._mountComponents(components);
    }
}
