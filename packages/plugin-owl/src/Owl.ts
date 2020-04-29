import { QWeb } from '@odoo/owl';
import { JWPluginConfig, JWPlugin } from '../../core/src/JWPlugin';
import { OwlDomRenderer } from './ui/OwlDomRenderer';
import { Loadables } from '../../core/src/JWEditor';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { OwlEnv } from './ui/OwlComponent';

export class Owl<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Renderer> = {
        renderers: [OwlDomRenderer],
    };
    readonly loaders = {
        owlTemplates: this._loadTemplates,
    };

    owlEnv: OwlEnv = {
        qweb: new QWeb(),
        editor: this.editor,
    };

    private _loadTemplates(templates: Array<string | Document>): void {
        for (const template of templates) {
            this.owlEnv.qweb.addTemplates(template);
        }
    }
}
