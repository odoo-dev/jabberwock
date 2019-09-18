import { QWeb } from 'owl-framework';
import { JWEditor } from '../core/JWEditor';
import { JWOwlUIPlugin } from './JWOwlUIPlugin';
import { OwlUIComponent } from './OwlUIComponent';

interface PluginEnv {
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
        const pluginInstance = new PluginClass();
        this.pluginsRegistry.push(pluginInstance);
        await this._mountPluginComponents(pluginInstance);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Create the owl-required `env` variable for a plugin's Components, using
     * the plugin's templates and adding the instance of the current editor
     *
     * @param {JWOwlUIPlugin} pluginInstance
     * @returns {Promise<PluginEnv>}
     */
    async _createPluginEnv(pluginInstance: JWOwlUIPlugin): Promise<PluginEnv> {
        return {
            qweb: new QWeb(pluginInstance.templates),
            editor: this.editor,
        };
    }
    /**
     * Mount all of a plugin's Components
     *
     * @param {JWOwlUIPlugin} pluginInstance
     * @returns {Promise<void>}
     */
    async _mountPluginComponents(pluginInstance: JWOwlUIPlugin): Promise<void> {
        const env: PluginEnv = await this._createPluginEnv(pluginInstance);
        const components = pluginInstance.componentsRegistry.slice();
        components.forEach((_Component: typeof OwlUIComponent) => {
            this._mount(_Component, env);
        });
    }
    /**
     * Mount a single component with the given `env`
     *
     * @param {typeof OwlUIComponent} _Component
     * @param {PluginEnv} env
     * @returns {Promise<void>}
     */
    async _mount(_Component: typeof OwlUIComponent, env: PluginEnv): Promise<void> {
        const component = new _Component(env);
        const target: HTMLElement = this.editor.el;
        await component.mount(target);
    }
}
