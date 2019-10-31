import { JWEditor } from '../core/JWEditor';
import { JWOwlUIPlugin } from './JWOwlUIPlugin';
import { QWeb } from 'owl-framework';
import { Env } from 'owl-framework/src/component/component';

export interface OwlUIEnv extends Env {
    editor: JWEditor;
}

export class OwlUI {
    pluginsRegistry: JWOwlUIPlugin[] = [];
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
    async addPlugin(PluginClass: typeof JWOwlUIPlugin): Promise<void> {
        this.env.qweb.addTemplates(PluginClass.templates);
        const plugin = new PluginClass(this.env);
        this.pluginsRegistry.push(plugin);
    }
}
