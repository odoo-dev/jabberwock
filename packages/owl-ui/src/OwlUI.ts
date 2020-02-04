import { JWEditor } from '../../core/src/JWEditor';
import { JWOwlUIPlugin, MountOptions } from './JWOwlUIPlugin';
import { QWeb } from 'owl-framework';
import { Env } from 'owl-framework/src/component/component';

export interface OwlUIEnv extends Env {
    editor: JWEditor;
}

export class OwlUI {
    plugins: JWOwlUIPlugin[] = [];
    env: OwlUIEnv;
    constructor(editor: JWEditor) {
        // Create the owl `env` variable shared by all plugins components.
        this.env = {
            qweb: new QWeb(),
            editor: editor,
        };
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Add an Owl UI Plugin to the registry and mount its components
     *
     * @param {typeof JWOwlUIPlugin} PluginClass
     * @returns {Promise<void>}
     */
    addPlugin(PluginClass: typeof JWOwlUIPlugin): void {
        this.env.qweb.addTemplates(PluginClass.templates);
        const plugin = new PluginClass(this.env);
        this.plugins.push(plugin);
    }

    /**
     * Start the Owl UI by starting all its registered plugins.
     *
     */
    async start(options?: MountOptions): Promise<void> {
        for (const plugin of this.plugins) {
            await plugin.start(options);
        }
    }

    /**
     * Stop the Owl UI by starting all its registered plugins.
     *
     */
    async stop(): Promise<void> {
        for (const plugin of this.plugins) {
            await plugin.stop();
        }
    }
}
