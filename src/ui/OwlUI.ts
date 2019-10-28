import { JWEditor } from '../core/JWEditor';
import { JWOwlUIPlugin } from './JWOwlUIPlugin';
import { QWeb } from 'owl-framework';

export interface PluginEnv {
    qweb: QWeb;
    editor: JWEditor;
}

export class OwlUI {
    pluginsRegistry: JWOwlUIPlugin[] = [];
    editor: JWEditor;
    constructor(editor: JWEditor) {
        this.editor = editor;
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
        const env = await this._createEnv(PluginClass);
        const plugin = new PluginClass(this.editor.dispatcher, env);
        this.pluginsRegistry.push(plugin);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Create the owl-required `env` variable for a plugin's Components, using
     * the plugin's templates and adding the instance of the current editor
     *
     * @returns {Promise<PluginEnv>}
     */
    async _createEnv(PluginClass: typeof JWOwlUIPlugin): Promise<PluginEnv> {
        return {
            qweb: new QWeb({ templates: PluginClass.templates }),
            editor: this.editor,
        };
    }
}
