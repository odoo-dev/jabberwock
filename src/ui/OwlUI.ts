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
        const plugin = new PluginClass(this.editor.dispatcher);
        this.pluginsRegistry.push(plugin);
        await this._handleComponents(plugin);
        this.editor.dispatcher.register(plugin.handlers, plugin.commands);
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
     * Mount all of a plugin's Components to Owl and register its components'
     * intents, actions and commands (TODO: this does not work for
     * sub-components since those are mounted by their parent and we do not have
     * access to their instantiation).
     *
     * @param {JWOwlUIPlugin} plugin
     * @returns {Promise<void>}
     */
    async _handleComponents(plugin: JWOwlUIPlugin): Promise<void> {
        const env: PluginEnv = await this._createPluginEnv(plugin);
        const Components = plugin.componentsRegistry.slice();
        for (let i = 0; i < plugin.componentsRegistry.length; i++) {
            const component = new Components[i](env);
            await this._mount(component);
            this._register(component);
        }
    }
    /**
     * Mount a single component
     *
     * @param {OwlUIComponent} component
     * @returns {Promise<void>}
     */
    async _mount(component: OwlUIComponent<{}, {}>): Promise<void> {
        const target: HTMLElement = this.editor.el;
        await component.mount(target);
    }
    /**
     * Register a component's dispatcher registry records ('intents',
     * 'commands', 'actions') in its plugin so it can in turn register them in
     * Jabberwock's dispatcher
     *
     * @param {OwlUIComponent} component
     * @param {JWOwlUIPlugin} pluginInstance
     */
    _register(component: OwlUIComponent<{}, {}>): void {
        this.editor.dispatcher.register(component.handlers, component.commands);
    }
}
