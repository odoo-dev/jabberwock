import { JWEditor } from '../core/JWEditor';
import { JWOwlUIPlugin } from './JWOwlUIPlugin';
import { Component, utils, QWeb } from 'owl-framework';

export class OwlUI {
    pluginsRegistry: JWOwlUIPlugin[];
    editor: JWEditor;
    env: object;
    constructor(editor: JWEditor) {
        this.editor = editor;
        this.pluginsRegistry = [];
    }

    async addPlugin(PluginClass: typeof JWOwlUIPlugin): Promise<void> {
        const pluginInstance = new PluginClass();
        this.pluginsRegistry.push(pluginInstance);
        const templatePath: string = pluginInstance.templates;
        const templates: string = await utils.loadTemplates(templatePath);
        const env = {
            qweb: new QWeb(templates),
            editor: this.editor,
        };
        const components = pluginInstance.componentsRegistry.slice();
        components.forEach(
            async (ComponentClass: typeof Component): Promise<void> => {
                const component: Component<any, any, any> = new ComponentClass(env);
                const target: HTMLElement = this.editor.el;
                await component.mount(target);
            },
        );
    }
}

/**
    // OWL
    if (pluginInstance instanceof JWUIPlugin) {
        const templateFile: string = pluginInstance.templateFile;
        const templates: string = await owl.utils.loadTemplates(templateFile);
        const env = {
            qweb: new owl.QWeb(templates),
        };
        const component = this._buildComponent(pluginInstance);
        const target: Element = this.el;
        await component.mount(target);
    }
 */
