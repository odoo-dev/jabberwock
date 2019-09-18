import { QWeb } from 'owl-framework';
import { JWEditor } from '../core/JWEditor';
import { JWOwlUIPlugin, OwlUIComponent } from './JWOwlUIPlugin';

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
        const pluginInstance = new PluginClass(this.editor.dispatcher);
        this.pluginsRegistry.push(pluginInstance);
        const components: OwlUIComponent[] = await this._handleComponents(pluginInstance);
        this.editor.dispatcher.registerFromPlugin(
            pluginInstance.actions,
            pluginInstance.intents,
            pluginInstance.commands,
        );
        components.forEach(this._mount.bind(this));
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
     * Instantiate all of a plugin's Components to Owl and register its components'
     * intents, actions and commands (TODO: this does not work for
     * sub-components since those are mounted by their parent and we do not have
     * access to their instantiation).
     * Return the instances of the components.
     * Note: at this point they are not mounted yet as this should happen last.
     *
     * @param {JWOwlUIPlugin} pluginInstance
     * @returns {Promise<void>}
     */
    async _handleComponents(pluginInstance: JWOwlUIPlugin): Promise<OwlUIComponent[]> {
        const env: PluginEnv = await this._createPluginEnv(pluginInstance);
        const Components = pluginInstance.componentsRegistry.slice();
        const components: OwlUIComponent[] = [];
        for (let i = 0; i < Components.length; i++) {
            const component = new Components[i](env);
            this._register(component, pluginInstance);
            components.push(component);
        }
        return components;
    }
    /**
     * Mount a single component
     *
     * @param {OwlUIComponent} OwlUIComponent
     * @returns {Promise<void>}
     */
    _mount(component: OwlUIComponent): Promise<void> {
        const target: HTMLElement = this.editor.el;
        return component.mount(target);
    }
    /**
     * Register a component's dispatcher registry records ('intents',
     * 'commands', 'actions') in its plugin so it can in turn register them in
     * Jabberwock's dispatcher
     *
     * @param {OwlUIComponent} component
     * @param {JWOwlUIPlugin} pluginInstance
     */
    _register(component: OwlUIComponent, pluginInstance: JWOwlUIPlugin): void {
        ['intents', 'actions', 'commands'].forEach((type: string): void => {
            Object.keys(component[type]).forEach((name: string) => {
                if (pluginInstance[type][name]) {
                    console.warn(
                        'Two components respond to the ' +
                            type +
                            ' "' +
                            name +
                            '". TODO: resolve conflict (chain commands if they exist).',
                    );
                } else {
                    pluginInstance[type][name] = component[type][name];
                }
            });
        });
    }
}
