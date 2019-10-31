import { JWPlugin } from '../core/JWPlugin';
import { OwlUIEnv } from './OwlUI';
import { OwlUIComponent } from './OwlUIComponent';
import { config } from 'owl-framework';

export class JWOwlUIPlugin extends JWPlugin {
    Components: Array<typeof OwlUIComponent> = [];
    env: OwlUIEnv;
    static templates: string;
    constructor(env: OwlUIEnv) {
        super(env.editor.dispatcher);
        this.env = env;
        this.dispatcher.register(this.handlers, this.commands);
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
    _instantiateComponents(ComponentClasses: Array<typeof OwlUIComponent>): OwlUIComponent<{}>[] {
        // TODO: all owl components on the same page share the same env. This is
        // dangerous for libraries using owl like this one. The `setEnv` method,
        // commented below, will soon be added to Component in order to sandbox
        // it with the given env rather than using the global one. Until this
        // hook is added, the global env must be used instead.
        Object.assign(config.env, this.env);
        return ComponentClasses.map((ComponentClass: typeof OwlUIComponent) => {
            // TODO: uncomment the line below and remove the config hack above
            // when owl issue 430 is closed and introduces the `setEnv` method.
            // componentClass.setEnv(this.env);
            return new ComponentClass();
        });
    }
    async _mountComponents(components: OwlUIComponent<{}>[]): Promise<void> {
        const target: HTMLElement = this.env.editor.el;
        for (let i = 0; i < components.length; i++) {
            await components[i].mount(target);
        }
    }
}
