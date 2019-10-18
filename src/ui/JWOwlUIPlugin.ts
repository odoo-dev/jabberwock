import { JWPlugin } from '../core/JWPlugin';
import { Dispatcher } from '../core/dispatcher/Dispatcher';
import { PluginEnv } from './OwlUI';
import { OwlUIComponent } from './OwlUIComponent';

export class JWOwlUIPlugin extends JWPlugin {
    Components: Array<typeof OwlUIComponent> = [];
    env: PluginEnv;
    static templates: string;
    constructor(dispatcher: Dispatcher, env: PluginEnv) {
        super(dispatcher);
        this.env = env;
        dispatcher.register(this.handlers, this.commands);
        // Note: Always call init() in the constructor of a `JWOwlUIPlugin`.
    }

    async init(): Promise<void> {
        const components = await this._instantiateComponents(this.Components);
        this._mountComponents(components);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Mount all of a plugin's Components to Owl and register its components'
     * intents, actions and commands (TODO: this does not work for
     * sub-components since those are mounted by their parent and we do not have
     * access to their instantiation).
     * Return a promise that resolves to the mounted, instantiated components.
     *
     * @param {JWOwlUIPlugin} plugin
     * @returns {Promise<OwlUIComponent<{}, {}>[]>}
     */
    _instantiateComponents(Components: Array<typeof OwlUIComponent>): OwlUIComponent<{}>[] {
        return Components.map(
            (Component: typeof OwlUIComponent): OwlUIComponent<{}> => {
                return new Component(this.env);
            },
        );
    }
    async _mountComponents(components: OwlUIComponent<{}>[]): Promise<void> {
        const target: HTMLElement = this.env.editor.el;
        for (let i = 0; i < components.length; i++) {
            await components[i].mount(target);
        }
    }
}
