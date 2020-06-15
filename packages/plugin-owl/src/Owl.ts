import { QWeb } from '@odoo/owl';
import { JWPluginConfig, JWPlugin } from '../../core/src/JWPlugin';
import { OwlDomObjectRenderer } from './OwlDomObjectRenderer';
import { Loadables } from '../../core/src/JWEditor';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { OwlEnv, OwlComponent } from './OwlComponent';
import { VNode } from '../../core/src/VNodes/VNode';
import { Browser } from '@odoo/owl/dist/types/browser';

// Temporary fix waiting for the `Env` interface of Owl to let the `browser`
// property be optional
const browser: Browser = {
    setTimeout: window.setTimeout.bind(window),
    clearTimeout: window.clearTimeout.bind(window),
    setInterval: window.setInterval.bind(window),
    clearInterval: window.clearInterval.bind(window),
    requestAnimationFrame: window.requestAnimationFrame.bind(window),
    random: Math.random,
    Date: window.Date,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    fetch: (window.fetch || ((): void => {})).bind(window),
    localStorage: window.localStorage,
};

export class Owl<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Renderer> = {
        renderers: [OwlDomObjectRenderer],
    };
    readonly loaders = {
        owlTemplates: this._loadTemplates,
    };

    env: OwlEnv = {
        qweb: new QWeb(),
        editor: this.editor,
        browser: browser,
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
