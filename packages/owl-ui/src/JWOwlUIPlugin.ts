import { OwlUIEnv } from './OwlUI';
import { OwlUIComponent } from './OwlUIComponent';

// This is a non-exported interface from Owl.
export interface MountOptions {
    position?: 'first-child' | 'last-child' | 'self';
}

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
    async start(options?: MountOptions): Promise<void> {
        // Instantiate components.
        this.components = this.Components.map(ComponentClass => {
            ComponentClass.env = this.env;
            return new ComponentClass();
        });

        // Mount components.
        const target: HTMLElement = this.env.editor.el;
        for (const component of this.components) {
            await component.mount(target, options);
        }
    }

    /**
     * Unmount all of a plugin's Components to Owl.
     * Return a promise that resolves to the mounted components.
     *
     */
    async stop(): Promise<void> {
        for (const component of this.components) {
            await component.unmount();
        }
    }
}
