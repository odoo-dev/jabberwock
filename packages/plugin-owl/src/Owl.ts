import { QWeb } from '@odoo/owl';
import { JWPluginConfig, JWPlugin } from '../../core/src/JWPlugin';
import { OwlHtmlDomRenderer } from './ui/OwlHtmlDomRenderer';
import { Loadables } from '../../core/src/JWEditor';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { OwlEnv, OwlComponent } from './ui/OwlComponent';
import { VNode } from '../../core/src/VNodes/VNode';

export class Owl<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Renderer> = {
        renderers: [OwlHtmlDomRenderer],
    };
    readonly loaders = {
        owlTemplates: this._loadTemplates,
    };

    env: OwlEnv = {
        qweb: new QWeb(),
        editor: this.editor,
    };

    components = new Map<VNode, OwlComponent<{}>>();

    async stop(): Promise<void> {
        for (const [, component] of this.components) {
            component.destroy();
        }
        this.components.clear();
    }
    private _loadTemplates(templates: Array<string | Document>): void {
        for (const template of templates) {
            this.env.qweb.addTemplates(template);
        }
    }
}
