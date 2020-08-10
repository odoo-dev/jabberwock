import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';

import '../assets/Fullscreen.css';
import { VNode } from '../../core/src/VNodes/VNode';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Layout } from '../../plugin-layout/src/Layout';
import { Fullscreen } from './Fullscreen';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { DomObjectActionable } from '../../plugin-dom-layout/src/ActionableDomObjectRenderer';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';

export class FullscreenButtonDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = (node: VNode): boolean =>
        node instanceof ActionableNode && node.actionName === 'fullscreen';

    /**
     * Render the FullscreenNode.
     */
    async render(
        button: ActionableNode,
        worker: RenderingEngineWorker<DomObject>,
    ): Promise<DomObjectActionable> {
        const domObject = (await this.super.render(button, worker)) as DomObjectActionable;
        const fullscreenPlugin = this.engine.editor.plugins.get(Fullscreen);
        const domLayoutEngine = this.engine.editor.plugins.get(Layout).engines
            .dom as DomLayoutEngine;

        let elButton: Element;
        domObject.handler = (): void => {
            // only one component can be display in fullscreen
            const component =
                domLayoutEngine.components[fullscreenPlugin.configuration.component]?.[0];

            if (component) {
                // only one element can be display in fullscreen
                const element = domLayoutEngine.getDomNodes(component)[0];
                if (element instanceof Element) {
                    if (fullscreenPlugin.isFullscreen) {
                        element.classList.remove('jw-fullscreen');
                        elButton.classList.remove('pressed');
                        elButton.setAttribute('aria-pressed', 'false');
                    } else {
                        fullscreenPlugin.isFullscreen = true;
                        document.body.classList.add('jw-fullscreen');
                        element.classList.add('jw-fullscreen');
                        elButton.classList.add('pressed');
                        elButton.setAttribute('aria-pressed', 'true');
                        window.dispatchEvent(new CustomEvent('resize'));
                        return;
                    }
                }
            }
            if (fullscreenPlugin.isFullscreen) {
                fullscreenPlugin.isFullscreen = false;
                document.body.classList.remove('jw-fullscreen');
                window.dispatchEvent(new CustomEvent('resize'));
            }
        };
        const attach = domObject.attach;
        // TODO: Replace these handlers by a `stop` mechanism for renderers.
        domObject.attach = function(el: Element): void {
            elButton = el;
            attach.call(this, el);
            if (fullscreenPlugin.isFullscreen) {
                document.body.classList.add('jw-fullscreen');
            }
        };
        const detach = domObject.detach;
        // TODO: Replace these handlers by a `stop` mechanism for renderers.
        domObject.detach = function(el: Element): void {
            elButton = null;
            detach.call(this, el);
            document.body.classList.remove('jw-fullscreen');
        };
        return domObject;
    }
}
