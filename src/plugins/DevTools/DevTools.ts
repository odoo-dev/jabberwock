import { DevToolsComponent } from './components/DevToolsComponent';
import { JWOwlUIPlugin } from '../../ui/JWOwlUIPlugin';
import devtoolsTemplates from './DevTools.xml';
import { OwlUIComponent } from '../../ui/OwlUIComponent';

export class DevTools extends JWOwlUIPlugin {
    static templates = devtoolsTemplates;
    Components = [DevToolsComponent as typeof OwlUIComponent];
    constructor(dispatcher, env) {
        super(dispatcher, env);
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
        components.forEach((component: OwlUIComponent<{}, {}>): void => {
            this.env.editor.dispatcher.register(component.handlers, component.commands);
        });
        this._mountComponents(components);
    }
}
