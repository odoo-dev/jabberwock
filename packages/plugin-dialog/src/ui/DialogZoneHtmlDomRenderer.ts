import { HtmlDomRenderingEngine } from '../../../plugin-html/src/HtmlDomRenderingEngine';
import { AbstractRenderer } from '../../../plugin-renderer/src/AbstractRenderer';
import { DialogZoneNode } from './DialogZoneNode';
import { VNode } from '../../../core/src/VNodes/VNode';
import template from './Dialog.xml';
import './Dialog.css';
import { Layout } from '../../../plugin-layout/src/Layout';
import { ComponentId } from '../../../plugin-layout/src/LayoutEngine';

const container = document.createElement('jw-container');
container.innerHTML = template;
const dialog = container.firstElementChild;

export class DialogZoneHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom/html';
    engine: HtmlDomRenderingEngine;
    predicate = DialogZoneNode;

    async render(node: DialogZoneNode): Promise<Node[]> {
        const float = document.createElement('jw-dialog-container');
        for (const child of node.childVNodes) {
            if (!node.hidden.get(child)) {
                float.appendChild(await this._renderDialog(child));
            }
        }
        return float.childNodes.length ? [float] : [document.createDocumentFragment()];
    }

    private async _renderDialog(node: VNode): Promise<Element> {
        const clone = dialog.cloneNode(true) as Element;
        const content = clone.querySelector('jw-content');
        for (const domNode of await this.engine.render(node)) {
            content.appendChild(domNode);
        }

        let componentId: ComponentId;
        const components = this.engine.editor.plugins.get(Layout).engines.dom.components;
        for (const [id, nodes] of components) {
            if (nodes.includes(node)) {
                componentId = id;
            }
        }

        clone.addEventListener('click', (ev: MouseEvent): void => {
            const target = ev.target as Element;
            if (target.classList.contains('jw-close')) {
                this.engine.editor.execCommand('hide', { componentID: componentId });
            }
        });

        return clone;
    }
}
