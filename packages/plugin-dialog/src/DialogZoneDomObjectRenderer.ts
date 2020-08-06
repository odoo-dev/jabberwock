import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { DialogZoneNode } from './DialogZoneNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { ComponentId } from '../../plugin-layout/src/LayoutEngine';
import { Layout } from '../../plugin-layout/src/Layout';
import { MetadataNode } from '../../plugin-metadata/src/MetadataNode';

import template from '../assets/Dialog.xml';
import '../assets/Dialog.css';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';

const container = document.createElement('jw-container');
container.innerHTML = template;
const dialog = container.firstElementChild;

export class DialogZoneDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = DialogZoneNode;

    async render(
        node: DialogZoneNode,
        worker: RenderingEngineWorker<DomObject>,
    ): Promise<DomObject> {
        const float = document.createElement('jw-dialog-container');
        for (const child of node.childVNodes) {
            if (child.tangible || child instanceof MetadataNode) {
                if (!node.hidden?.[child.id]) {
                    float.appendChild(await this._renderDialog(child));
                }
                worker.depends(child, node);
            }
        }
        return {
            dom: float.childNodes.length ? [float] : [],
        };
    }

    private async _renderDialog(node: VNode): Promise<Element> {
        const clone = dialog.cloneNode(true) as Element;
        const content = clone.querySelector('jw-content');
        content.appendChild(this.engine.renderPlaceholder(node));
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
                this.engine.editor.execCommand('hide', { componentId: componentId });
            }
        });
        return clone;
    }
}
