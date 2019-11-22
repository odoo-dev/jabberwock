import { OwlUIEnv } from './OwlUI';
import { OwlUIComponent } from './OwlUIComponent';

export class JWOwlUIPlugin {
    Components: Array<typeof OwlUIComponent> = [];
    env: OwlUIEnv;
    static templates: string;

    constructor(env: OwlUIEnv) {
        this.env = env;
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
        return ComponentClasses.map((ComponentClass: typeof OwlUIComponent) => {
            ComponentClass.env = this.env;
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
