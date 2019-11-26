import { OwlUIEnv } from './OwlUI';
import { OwlUIComponent } from './OwlUIComponent';

export class JWOwlUIPlugin {
    env: OwlUIEnv;
    static templates: string;
    Components: Array<typeof OwlUIComponent> = [];
    components: OwlUIComponent<{}>[] = [];

    constructor(env: OwlUIEnv) {
        this.env = env;
    }

    /**
     * Mount all of a plugin's Components to Owl.
     * Return a promise that resolves to the mounted components.
     *
     */
    async start(): Promise<void> {
        // Instantiate components.
        this.components = this.Components.map(ComponentClass => {
            ComponentClass.env = this.env;
            return new ComponentClass();
        });

        // Mount components.
        const target: HTMLElement = this.env.editor.el;
        for (let i = 0; i < this.components.length; i++) {
            await this.components[i].mount(target);
        }
    }
}
